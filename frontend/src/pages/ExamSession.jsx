import React, { useEffect, useRef, useState, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import * as faceapi from '@vladmandic/face-api';
import axios from 'axios';
import { io } from 'socket.io-client';
import { AuthContext } from '../context/AuthContext';
import { Shield, Clock, ChevronRight, ChevronLeft, Save, AlertTriangle, User, Camera, MessageSquare } from 'lucide-react';

const ExamSession = () => {
  const { id } = useParams();
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();

  const videoRef = useRef();
  const [exam, setExam] = useState(null);
  const [attemptId, setAttemptId] = useState(null);
  const attemptIdRef = useRef(null);
  const [status, setStatus] = useState('Initializing Exam...');
  const [violations, setViolations] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState(0);
  
  // Dual Media Recorders tracking state
  const [screenShared, setScreenShared] = useState(false);

  // Webcam Tracking
  const streamRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const recordedChunksRef = useRef([]);
  const validSnapshotBlobRef = useRef(null);
  const recordingIntervalRef = useRef(null);

  // Screen Tracking
  const screenStreamRef = useRef(null);
  const screenRecorderRef = useRef(null);
  const recordedScreenChunksRef = useRef([]);
  const validScreenBlobRef = useRef(null);
  const screenRecordingIntervalRef = useRef(null);

  const [registeredFace, setRegisteredFace] = useState(null);
  const monitoringInterval = useRef();
  
  // Track Answers
  const [answers, setAnswers] = useState({});
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);

  // Proctor Chat Session
  const socketRef = useRef(null);
  const [proctorMessage, setProctorMessage] = useState(null);

  // Fullscreen lock & auto-submit
  const [shouldAutoSubmit, setShouldAutoSubmit] = useState(false);
  const isTerminating = useRef(false);
  
  useEffect(() => {
    if (shouldAutoSubmit) {
      isTerminating.current = true;
      alert("Exam Terminated: You attempted to minimize or exit fullscreen, which is strictly prohibited. Your current progress has been submitted.");
      submitExam();
    }
  }, [shouldAutoSubmit]);

  const shuffleArray = (array) => {
    const newArr = [...array];
    for (let i = newArr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [newArr[i], newArr[j]] = [newArr[j], newArr[i]];
    }
    return newArr;
  };

  useEffect(() => {
    // 1. Fetch Exam and Setup Attempt in DB
    const loadSetup = async () => {
      try {
        const examRes = await axios.get(`${import.meta.env.VITE_API_URL}/api/exams/${id}`, {
          headers: { Authorization: `Bearer ${user.token}` }
        });
        const examData = examRes.data;
        if (examData.questions) {
           examData.questions = examData.questions.map(q => ({
               ...q,
               options: shuffleArray(q.options)
           }));
           examData.questions = shuffleArray(examData.questions);
        }
        
        setExam(examData);
        setTimeRemaining(examData.duration * 60);

        const attemptRes = await axios.post(`${import.meta.env.VITE_API_URL}/api/attempts/start`, { examId: id }, {
          headers: { Authorization: `Bearer ${user.token}` }
        });
        setAttemptId(attemptRes.data._id);
        attemptIdRef.current = attemptRes.data._id;
        setViolations(attemptRes.data.violationsCount);

        // Fetch user profile to get face encoding array back
        const profileRes = await axios.get(`${import.meta.env.VITE_API_URL}/api/auth/profile`, {
           headers: { Authorization: `Bearer ${user.token}` }
        });
        const arr = profileRes.data.faceEncoding;
        const descriptor = new Float32Array(arr);
        setRegisteredFace(descriptor);

        // 4. Load AI models for Proctoring Monitoring
        await Promise.all([
          faceapi.nets.ssdMobilenetv1.loadFromUri(window.location.origin + '/models'),
          faceapi.nets.faceLandmark68Net.loadFromUri(window.location.origin + '/models'),
          faceapi.nets.faceRecognitionNet.loadFromUri(window.location.origin + '/models')
        ]);

        setStatus('Awaiting Screen Share Permission...');
      } catch (err) {
        console.error("Exam loading failed:", err);
        setStatus('Critical Error: Failed to initialize AI models.');
      }
    };
    loadSetup();

    // 2. Initialize WebSocket for Live Proctoring
    socketRef.current = io(import.meta.env.VITE_API_URL);
    socketRef.current.emit('join_room', user._id || user.uid);
    socketRef.current.on('alert_message', (data) => {
      setProctorMessage(data.message);
      // Also silently log that a proctor warned the student
      setStatus(`Direct Message Received from Proctor`);
    });

    // 3. Tab switch listener
    const handleVisibilityChange = () => {
      if (isTerminating.current) return;
      if (document.visibilityState === 'hidden') {
        recordViolation('tab_switched', 'User switched tabs or minimized the browser during the exam');
        setShouldAutoSubmit(true);
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // 4. Fullscreen exit listener — triggers 10s clip + termination
    const handleFullscreenChange = () => {
      if (isTerminating.current) return;
      if (!document.fullscreenElement) {
        recordViolation('fullscreen_exit', 'Student exited fullscreen mode during the exam');
        setShouldAutoSubmit(true);
      }
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);

    // 5. Block keyboard shortcuts that can escape the exam context
    const handleKeyDown = (e) => {
      const isMacCmd = e.metaKey;
      const isCtrl = e.ctrlKey;
      const isAlt = e.altKey;
      const key = e.key.toLowerCase();

      const blocked =
        // Standard Windows/Linux blocks
        (isCtrl && ['t', 'w', 'r', 'n', 'c', 'v', 'x', 'p'].includes(key)) ||
        (isCtrl && key === 'tab') ||
        (isAlt && key === 'f4') ||
        key === 'f5' ||
        key === 'f11' ||
        // Mac Command blocks
        (isMacCmd && ['t', 'w', 'r', 'n', 'c', 'v', 'x', 'p', 'm', 'q'].includes(key)) ||
        (isMacCmd && key === 'tab') ||
        (isMacCmd && e.shiftKey) || // Block Cmd+Shift+... (screenshots, DevTools)
        (isAlt && isMacCmd); // Block Cmd+Option+... (Force Quit, etc.)
        
      if (blocked && screenRecorderRef.current) {
        e.preventDefault();
        e.stopPropagation();
      }
    };
    document.addEventListener('keydown', handleKeyDown, true);

    // 6. Block context menu (Right Click)
    const handleContextMenu = (e) => {
      if (screenRecorderRef.current) {
        e.preventDefault();
      }
    };
    document.addEventListener('contextmenu', handleContextMenu);

    // 7. Window Blur listener (Catches OS-level overrides like Cmd+Tab, Spotlight, Mission Control)
    const handleBlur = () => {
      if (isTerminating.current) return;
      if (screenRecorderRef.current) {
        recordViolation('focus_lost', 'User switched apps (Cmd+Tab) or lost window focus');
        setShouldAutoSubmit(true);
      }
    };
    window.addEventListener('blur', handleBlur);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('keydown', handleKeyDown, true);
      document.removeEventListener('contextmenu', handleContextMenu);
      window.removeEventListener('blur', handleBlur);
      clearInterval(monitoringInterval.current);
      clearInterval(recordingIntervalRef.current);
      clearInterval(screenRecordingIntervalRef.current);
      
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
         mediaRecorderRef.current.stop();
      }
      if (screenRecorderRef.current && screenRecorderRef.current.state !== 'inactive') {
         screenRecorderRef.current.stop();
      }

      if (document.fullscreenElement) {
         document.exitFullscreen().catch(err => console.log(err));
      }
      if (streamRef.current) {
         streamRef.current.getTracks().forEach(track => track.stop());
      }
      if (screenStreamRef.current) {
         screenStreamRef.current.getTracks().forEach(track => track.stop());
      }
      if (socketRef.current) {
         socketRef.current.disconnect();
      }
    };
  }, [id, user]);
  
  // Autosave Logic (Debounced)
  useEffect(() => {
    if (!Object.keys(answers).length || !attemptIdRef.current) return;
    
    const timer = setTimeout(async () => {
       try {
         await axios.patch(`${import.meta.env.VITE_API_URL}/api/attempts/${attemptIdRef.current}/autosave`, 
           { answers }, 
           { headers: { Authorization: `Bearer ${user.token}` } }
         );
       } catch (err) {
         console.error('Autosave failed', err);
       }
    }, 5000); // Save every 5 seconds of inactivity

    return () => clearTimeout(timer);
  }, [answers, user.token]);

  const startScreenShare = async () => {
    try {
      const screenStream = await navigator.mediaDevices.getDisplayMedia({ 
          video: { displaySurface: 'monitor' }, 
          audio: false 
      });
      
      if (!screenStream) return;
      
      screenStreamRef.current = screenStream;
      setScreenShared(true);
      
      // Enter Fullscreen securely upon user gesture granted
      if (document.documentElement.requestFullscreen) {
          document.documentElement.requestFullscreen().then(() => {
              if (navigator.keyboard && navigator.keyboard.lock) {
                  // Prevent Escape key and other system shortcuts
                  navigator.keyboard.lock();
              }
          }).catch(() => {});
      }

      // Initialize Native 10s Screen Recorder Cycle
      const mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp8') ? 'video/webm;codecs=vp8' : 'video/mp4';
      
      const restartScreenRecorder = () => {
          if (screenRecorderRef.current && screenRecorderRef.current.state !== 'inactive') {
             screenRecorderRef.current.requestData();
             screenRecorderRef.current.stop();
          }

          screenRecorderRef.current = new MediaRecorder(screenStream, { mimeType });
          recordedScreenChunksRef.current = [];

          screenRecorderRef.current.ondataavailable = (e) => {
            if (e.data.size > 0) recordedScreenChunksRef.current.push(e.data);
          };

          screenRecorderRef.current.onstop = () => {
             const blob = new Blob(recordedScreenChunksRef.current, { type: mimeType });
             validScreenBlobRef.current = blob; 
          };

          screenRecorderRef.current.start();
      };

      restartScreenRecorder();
      screenRecordingIntervalRef.current = setInterval(restartScreenRecorder, 10000);

      // Listen for Native Screen Share Stop (e.g. clicking "Stop Sharing" on Chrome bar)
      screenStream.getVideoTracks()[0].onended = () => {
          recordViolation('screen_stopped', 'User actively stopped sharing their screen natively.');
      };

      // Immediately chain into launching Webcam natively
      startVideo();

    } catch (err) {
      console.error("Screen Share Error:", err);
      alert('You must grant Screen Sharing permission to attempt this exam. Returning to Dashboard.');
      navigate('/');
    }
  };

  const startVideo = () => {
    navigator.mediaDevices.getUserMedia({ video: { width: 320, height: 240 } })
      .then(stream => {
        streamRef.current = stream;
        if (videoRef.current) videoRef.current.srcObject = stream;

        // Initialize Native Complete 10s Webcam MediaRecorder Cycle
        const mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp8') ? 'video/webm;codecs=vp8' : 'video/mp4';
        
        const restartRecorder = () => {
            if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
               mediaRecorderRef.current.requestData();
               mediaRecorderRef.current.stop();
            }

            mediaRecorderRef.current = new MediaRecorder(stream, { mimeType });
            recordedChunksRef.current = [];

            mediaRecorderRef.current.ondataavailable = (e) => {
              if (e.data.size > 0) {
                recordedChunksRef.current.push(e.data);
              }
            };

            mediaRecorderRef.current.onstop = () => {
               const blob = new Blob(recordedChunksRef.current, { type: mimeType });
               validSnapshotBlobRef.current = blob; 
            };

            mediaRecorderRef.current.start();
        };

        restartRecorder();
        recordingIntervalRef.current = setInterval(restartRecorder, 10000);
      })
      .catch(err => setStatus('Warning: Unable to start webcam.'));
  };

  const handleVideoPlay = () => {
    // Start continuous face monitoring
    monitoringInterval.current = setInterval(async () => {
      // Abort gracefully if exam hasn't fully launched
      if (!videoRef.current || !registeredFace || !screenShared) return;

      try {
        const detections = await faceapi.detectAllFaces(videoRef.current)
          .withFaceLandmarks()
          .withFaceDescriptors();

        if (detections.length === 0) {
          recordViolation('no_face', 'No face detected. Please adjust your camera or sit properly.');
          return;
        }

        if (detections.length > 1) {
          recordViolation('multiple_faces', 'More than one face detected');
          return;
        }

        // 1 Face, Verify it
        const currentDescriptor = detections[0].descriptor;
        const distance = faceapi.euclideanDistance(registeredFace, currentDescriptor);

        if (distance > 0.6) { // Threshold
          recordViolation('unknown_face', `Face mismatch detected (distance: ${distance.toFixed(2)})`);
        } else {
          setStatus('Monitoring Active - Biometrics Verified');
        }
      } catch (err) {
        console.error('Face detection error:', err);
        setStatus(`Warning: Face detection failed. Please adjust your camera or check lighting.`);
      }

    }, 4000); // Check every 4 seconds
  };

  const recordViolation = async (eventType, description) => {
    setStatus(`Warning: ${description}`);
    const currentAttemptId = attemptIdRef.current;
    if (!currentAttemptId) return;

    // Detect target medium logically
    const isScreenViolation = eventType === 'tab_switched' || eventType === 'screen_stopped';
    const targetRecorderRef = isScreenViolation ? screenRecorderRef : mediaRecorderRef;
    const targetBlobRef = isScreenViolation ? validScreenBlobRef : validSnapshotBlobRef;

    // Capture a 10-second clip from the appropriate recorder
    let snapshotBase64 = null;
    if (targetRecorderRef.current && targetRecorderRef.current.state !== 'inactive') {
       try {
         // Stop the current recording cycle to finalize the blob
         const waitForBlob = new Promise((resolve) => {
            const onStop = () => {
              resolve(targetBlobRef.current);
            };
            targetRecorderRef.current.addEventListener('stop', onStop, { once: true });
         });

         targetRecorderRef.current.requestData();
         targetRecorderRef.current.stop();

         const finalBlob = await Promise.race([
           waitForBlob,
           new Promise(r => setTimeout(() => r(null), 3000)) // 3s timeout safety
         ]);

         // Restart the recorder immediately for the next cycle
         const stream = isScreenViolation ? screenStreamRef.current : streamRef.current;
         if (stream && stream.active) {
           const mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp8') ? 'video/webm;codecs=vp8' : 'video/mp4';
           const chunksRef = isScreenViolation ? recordedScreenChunksRef : recordedChunksRef;
           
           targetRecorderRef.current = new MediaRecorder(stream, { mimeType });
           chunksRef.current = [];
           
           targetRecorderRef.current.ondataavailable = (e) => {
             if (e.data.size > 0) chunksRef.current.push(e.data);
           };
           targetRecorderRef.current.onstop = () => {
             const blob = new Blob(chunksRef.current, { type: mimeType });
             targetBlobRef.current = blob;
           };
           targetRecorderRef.current.start();
         }

         // Convert the finalized blob to base64
         if (finalBlob && finalBlob.size > 0) {
           snapshotBase64 = await new Promise((res) => {
             const reader = new FileReader();
             reader.onloadend = () => res(reader.result);
             reader.onerror = () => res(null);
             reader.readAsDataURL(finalBlob);
           });
         }
       } catch (recErr) {
         console.error('Recording capture error:', recErr);
       }
    }

    try {
      const res = await axios.post(`${import.meta.env.VITE_API_URL}/api/attempts/${currentAttemptId}/violation`, 
        { eventType, description, snapshotVideo: snapshotBase64 },
        { headers: { Authorization: `Bearer ${user.token}` } }
      );
      
      setViolations(res.data.violationsCount);
      setStatus(`Violation recorded: ${description}`);

      if (res.data.status === 'terminated') {
        isTerminating.current = true;
        alert('Exam Terminated due to a critical violation.');
        navigate('/');
      }
    } catch (err) {
      console.error('Violation record error', err);
      setStatus(`Error: Failed to log violation (${err.message || 'Unknown error'})`);
    }
  };

  const submitExam = async () => {
    try {
      const currentAttemptId = attemptIdRef.current;
      if (currentAttemptId) {
        // Convert index-based answers to text-based for backend scoring or pass raw text/blobs for strings
        const resolvedAnswers = {};
        if (exam?.questions) {
          Object.entries(answers).forEach(([questionId, studentVal]) => {
            const question = exam.questions.find(q => q._id === questionId);
            if (question) {
               if (!question.type || question.type === 'mcq') {
                  if (question.options[studentVal] !== undefined) {
                     resolvedAnswers[questionId] = question.options[studentVal];
                  }
               } else {
                  resolvedAnswers[questionId] = studentVal;
               }
            }
          });
        }
        await axios.post(`${import.meta.env.VITE_API_URL}/api/attempts/${currentAttemptId}/submit`, { answers: resolvedAnswers }, {
          headers: { Authorization: `Bearer ${user.token}` }
        });
      }
      navigate('/');
    } catch (err) {
      console.error(err);
    }
  };

  const handleAnswerSelection = (questionKey, optionIndex) => {
    setAnswers(prev => ({ ...prev, [questionKey]: optionIndex }));
  };

  const handleAnswerText = (questionKey, textValue) => {
    setAnswers(prev => ({ ...prev, [questionKey]: textValue }));
  };

  const handleFileAnswer = (questionKey, file) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
       setAnswers(prev => ({ ...prev, [questionKey]: reader.result }));
    };
    reader.readAsDataURL(file);
  };

  useEffect(() => {
    if (timeRemaining <= 0 && exam && screenShared) {
      submitExam();
      return;
    }
    // Only tick the timer realistically if screen is securely shared
    if (screenShared) {
        const timer = setInterval(() => {
          setTimeRemaining(prev => prev - 1);
        }, 1000);
        return () => clearInterval(timer);
    }
  }, [timeRemaining, exam, screenShared]);

  const formatTime = (secs) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  if (!exam) return (
    <div style={{ minHeight: '100vh', background: 'var(--background)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '1rem' }}>
       <div className="animate-spin" style={{ width: '40px', height: '40px', border: '4px solid var(--primary)', borderTopColor: 'transparent', borderRadius: '50%' }}></div>
       <p style={{ color: 'var(--text-secondary)', fontWeight: '600' }}>Initialising Secure Environment...</p>
    </div>
  );

  if (!screenShared) {
      return (
        <div style={{ minHeight: '100vh', background: 'var(--background)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
          <div className="card animate-fade-in" style={{ maxWidth: '500px', padding: '3rem', textAlign: 'center' }}>
            <div style={{ background: 'rgba(79, 70, 229, 0.1)', width: '80px', height: '80px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 2rem' }}>
               <Shield size={40} color="var(--primary)" />
            </div>
            <h2 style={{ fontSize: '1.75rem', fontWeight: '800', marginBottom: '1rem' }}>Security Verification</h2>
            <p style={{ color: 'var(--text-secondary)', lineHeight: '1.6', marginBottom: '2rem' }}>
              To ensure academic integrity, this exam requires a persistent screen-sharing session. Your activity will be monitored and recorded.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <button className="btn btn-primary" onClick={startScreenShare} style={{ padding: '1rem' }}>
                Grant & Initialize Session
              </button>
              <button className="btn" onClick={() => navigate('/')} style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)' }}>
                Return to Dashboard
              </button>
            </div>
          </div>
        </div>
      );
  }

  const currentQuestion = exam.questions?.[currentQuestionIdx];
  const isAnswered = (idx) => {
    const q = exam.questions?.[idx];
    return q && (answers[q._id] !== undefined && answers[q._id] !== '');
  };

  // Actual Exam UI - Simplified for Performance
  return (
    <div style={{ minHeight: '100vh', background: 'var(--background)', color: 'var(--text-primary)', position: 'relative', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
      
      {/* HUD: TOP STATUS BAR */}
      <header style={{ height: '70px', background: 'rgba(255,255,255,0.05)', backdropFilter: 'blur(10px)', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 2rem', position: 'sticky', top: 0, zIndex: 100 }}>
        <div className="flex items-center gap-4">
           <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#10b981', boxShadow: '0 0 10px #10b981' }}></div>
           <div>
             <h1 style={{ fontSize: '1.1rem', fontWeight: '700', margin: 0 }}>{exam.title}</h1>
             <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', margin: 0 }}>Proctored Institutional Assessment</p>
           </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '3rem' }}>
           <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', background: 'rgba(0,0,0,0.05)', padding: '0.5rem 1.25rem', borderRadius: '30px', border: '1px solid var(--border)' }}>
              <Clock size={18} color="var(--primary)" />
              <span style={{ fontSize: '1.25rem', fontWeight: '800', fontFamily: 'monospace', letterSpacing: '1px' }}>{formatTime(timeRemaining)}</span>
           </div>
           
           <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
              <div style={{ textAlign: 'right' }}>
                <p style={{ fontSize: '0.7rem', textTransform: 'uppercase', color: 'var(--text-secondary)', fontWeight: '700', marginBottom: '2px' }}>Security State</p>
                <p style={{ fontSize: '0.85rem', fontWeight: '700', color: status.includes('Warning') ? 'var(--danger)' : '#10b981', margin: 0 }}>{status.toUpperCase()}</p>
              </div>
           </div>
        </div>
      </header>

      <main style={{ flex: 1, display: 'grid', gridTemplateColumns: '1fr 320px', gap: '2rem', padding: '2rem', maxWidth: '1600px', margin: '0 auto', width: '100%' }}>
        
        {/* LEFT: WORKSPACE */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          {/* Proctor Message Alert */}
          {proctorMessage && (
            <div className="card animate-shake" style={{ background: 'rgba(239, 68, 68, 0.05)', border: '2px solid var(--danger)', padding: '1.5rem', position: 'relative' }}>
              <div className="flex items-center gap-3 mb-2">
                <AlertTriangle color="var(--danger)" />
                <h3 style={{ fontSize: '1.1rem', fontWeight: '800', color: 'var(--danger)' }}>URGENT PROCTOR MESSAGE</h3>
              </div>
              <p style={{ fontSize: '1.1rem', fontWeight: '600', marginBottom: '1.5rem' }}>"{proctorMessage}"</p>
              <button className="btn btn-primary" style={{ background: 'var(--danger)', border: 'none' }} onClick={() => setProctorMessage(null)}>
                Acknowledge & Dismiss
              </button>
            </div>
          )}

          {/* QUESTION CARD */}
          <div className="card animate-fade-in" style={{ padding: '2.5rem 3rem 3rem 3rem', flex: 1, background: 'var(--surface)', position: 'relative', display: 'flex', flexDirection: 'column' }}>
             <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem' }}>
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                  <div style={{ background: 'var(--primary)', color: 'white', padding: '0.5rem 1.5rem', borderRadius: '10px', fontSize: '0.85rem', fontWeight: '800', boxShadow: '0 4px 12px rgba(79, 70, 229, 0.2)' }}>
                    QUESTION {currentQuestionIdx + 1}
                  </div>
                  <div style={{ background: 'rgba(79, 70, 229, 0.08)', color: 'var(--primary)', padding: '0.5rem 1.25rem', borderRadius: '10px', fontSize: '0.85rem', fontWeight: '800', border: '1px solid rgba(79, 70, 229, 0.2)' }}>
                    {currentQuestion?.marks || 1} { (currentQuestion?.marks || 1) === 1 ? 'MARK' : 'MARKS' }
                  </div>
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  {currentQuestion?.type || 'MCQ'}
                </div>
             </div>

             {exam.questions?.length === 0 ? (
               <div style={{ padding: '4rem', textAlign: 'center' }}>No questions found.</div>
             ) : (
               <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
                 <h2 style={{ fontSize: '1.5rem', fontWeight: '700', lineHeight: '1.4', marginBottom: '2rem', color: 'var(--text-primary)' }}>
                   {currentQuestion?.questionText}
                 </h2>

                 <div style={{ flex: 1 }}>
                   {(!currentQuestion.type || currentQuestion.type === 'mcq') && (
                     <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                       {currentQuestion?.options.map((opt, oIdx) => {
                         const isSelected = answers[currentQuestion._id] === oIdx;
                         return (
                           <label 
                             key={oIdx} 
                             className="animate-slide-up"
                             style={{ 
                               display: 'flex', 
                               alignItems: 'center', 
                               gap: '1.25rem',
                               padding: '1.25rem 1.5rem', 
                               borderRadius: '12px',
                               border: isSelected ? '2px solid var(--primary)' : '1px solid var(--border)', 
                               background: isSelected ? 'rgba(79, 70, 229, 0.05)' : 'var(--background)', 
                               cursor: 'pointer',
                               transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                               animationDelay: `${oIdx * 0.05}s`
                             }}
                           >
                             <div style={{ 
                               width: '24px', 
                               height: '24px', 
                               borderRadius: '50%', 
                               border: isSelected ? '6px solid var(--primary)' : '2px solid var(--border)',
                               background: 'white',
                               transition: 'all 0.2s'
                             }}></div>
                             <input 
                               type="radio" 
                               name={`q-${currentQuestion._id}`} 
                               checked={isSelected}
                               onChange={() => handleAnswerSelection(currentQuestion._id, oIdx)}
                               style={{ display: 'none' }}
                             />
                             <span style={{ fontSize: '1.1rem', fontWeight: isSelected ? '700' : '500', color: isSelected ? 'var(--primary)' : 'var(--text-primary)' }}>
                               {opt}
                             </span>
                           </label>
                         );
                       })}
                     </div>
                   )}

                   {currentQuestion.type === 'text' && (
                     <textarea 
                       className="input"
                       style={{ width: '100%', minHeight: '300px', padding: '1.5rem', fontSize: '1.1rem', lineHeight: '1.6', background: 'var(--background)' }}
                       placeholder="Type your structured response here..."
                       value={answers[currentQuestion._id] || ''}
                       onChange={(e) => handleAnswerText(currentQuestion._id, e.target.value)}
                     />
                   )}

                   {currentQuestion.type === 'code' && (
                     <textarea 
                       className="input"
                       style={{ width: '100%', minHeight: '400px', padding: '1.5rem', fontFamily: 'monospace', fontSize: '1rem', background: '#1e1e2e', color: '#cdd6f4', border: 'none' }}
                       placeholder="// Implement your solution here..."
                       value={answers[currentQuestion._id] || ''}
                       onChange={(e) => handleAnswerText(currentQuestion._id, e.target.value)}
                     />
                   )}
                 </div>

                 {/* BOTTOM ACTIONS */}
                 <div style={{ marginTop: '3rem', paddingTop: '2rem', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <button 
                      className="btn"
                      disabled={currentQuestionIdx === 0}
                      onClick={() => setCurrentQuestionIdx(idx => idx - 1)}
                      style={{ padding: '0.8rem 2rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                    >
                      <ChevronLeft size={20} /> Previous
                    </button>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                       <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: '600' }}>
                         Progress: {Object.keys(answers).length} / {exam.questions?.length} Saved
                       </span>
                       {currentQuestionIdx === (exam.questions?.length - 1) ? (
                         <button onClick={submitExam} className="btn btn-primary" style={{ padding: '0.8rem 3rem', background: 'var(--primary)', fontWeight: '800' }}>
                           Final Submission
                         </button>
                       ) : (
                         <button onClick={() => setCurrentQuestionIdx(idx => idx + 1)} className="btn btn-primary" style={{ padding: '0.8rem 2.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                           Next Question <ChevronRight size={20} />
                         </button>
                       )}
                    </div>
                 </div>
               </div>
             )}
          </div>
        </div>

        {/* RIGHT: NAVIGATION PALETTE & MONITOR */}
        <aside style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          {/* CAMERA FEED CARD */}
          <div className="card" style={{ padding: '0.75rem', background: 'var(--surface)', overflow: 'hidden' }}>
            <div style={{ position: 'relative', borderRadius: '12px', overflow: 'hidden', background: 'black', aspectRatio: '4/3' }}>
               <video 
                ref={videoRef} 
                autoPlay 
                muted 
                onPlay={handleVideoPlay}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
              <div style={{ position: 'absolute', bottom: '0.75rem', left: '0.75rem', background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', padding: '0.25rem 0.75rem', borderRadius: '4px', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                 <Camera size={12} color="#10b981" />
                 <span style={{ fontSize: '0.65rem', color: 'white', fontWeight: '700', letterSpacing: '0.5px' }}>LIVE PROCTORING ACTIVE</span>
              </div>
            </div>
          </div>

          {/* QUESTION PALETTE */}
          <div className="card" style={{ padding: '1.5rem', background: 'var(--surface)', flex: 1 }}>
             <h3 style={{ fontSize: '0.9rem', fontWeight: '800', color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '1.5rem', letterSpacing: '1px' }}>Assessment Navigator</h3>
             
             <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.75rem' }}>
                {exam.questions?.map((_, idx) => {
                  const active = currentQuestionIdx === idx;
                  const answered = isAnswered(idx);
                  return (
                    <button
                      key={idx}
                      onClick={() => setCurrentQuestionIdx(idx)}
                      style={{
                        height: '45px',
                        borderRadius: '8px',
                        border: active ? '2px solid var(--primary)' : '1px solid var(--border)',
                        background: active ? 'rgba(79, 70, 229, 0.1)' : (answered ? 'var(--primary)' : 'transparent'),
                        color: active ? 'var(--primary)' : (answered ? 'white' : 'var(--text-secondary)'),
                        fontWeight: '700',
                        fontSize: '0.9rem',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    >
                      {idx + 1}
                    </button>
                  );
                })}
             </div>

             <div style={{ marginTop: '2rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                   <div style={{ width: '12px', height: '12px', borderRadius: '3px', background: 'var(--primary)' }}></div>
                   <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: '600' }}>Attempted</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                   <div style={{ width: '12px', height: '12px', borderRadius: '3px', border: '1px solid var(--border)' }}></div>
                   <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: '600' }}>Unvisited</span>
                </div>
             </div>

             <div style={{ marginTop: 'auto', paddingTop: '2rem' }}>
                <button 
                  onClick={() => { if(window.confirm("End exam immediately?")) submitExam(); }}
                  style={{ width: '100%', background: 'transparent', border: '1px dashed var(--border)', padding: '0.75rem', borderRadius: '8px', color: 'var(--text-secondary)', fontSize: '0.8rem', fontWeight: '600', cursor: 'pointer' }}
                >
                  Terminate Session Early
                </button>
             </div>
          </div>
        </aside>

      </main>

    </div>
  );
};

export default ExamSession;
