import React, { useEffect, useRef, useState, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import * as faceapi from '@vladmandic/face-api';
import axios from 'axios';
import { io } from 'socket.io-client';
import { AuthContext } from '../context/AuthContext';const ExamSession = () => {
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
  
  useEffect(() => {
    if (shouldAutoSubmit) {
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
      if (document.hidden && screenRecorderRef.current) {
        recordViolation('tab_switched', 'User switched tabs or minimized the browser during the exam');
        setShouldAutoSubmit(true);
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // 4. Fullscreen exit listener — triggers 10s clip + termination
    const handleFullscreenChange = () => {
      if (!document.fullscreenElement && screenRecorderRef.current) {
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

      const detections = await faceapi.detectAllFaces(videoRef.current)
        .withFaceLandmarks()
        .withFaceDescriptors();

      if (detections.length === 0) {
        recordViolation('no_face', 'No face detected in the frame');
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

      if (res.data.status === 'terminated') {
        alert('Exam Terminated due to maximum violations exceeded.');
        navigate('/');
      }
    } catch (err) {
      console.error('Violation record error', err);
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

  if (!exam) return <div style={{ padding: '20px' }}>Loading Exam Environment...</div>;

  // Intercept Render strictly until Screen Permission is explicitly granted
  if (!screenShared) {
      return (
        <div style={{ padding: '40px 20px', textAlign: 'center', fontFamily: 'sans-serif' }}>
          <h2>Screen Share Required</h2>
          <p>This exam actively records your entire screen. You must explicitly grant screen recording permission.</p>
          <button onClick={startScreenShare} style={{ padding: '10px 20px', margin: '10px', background: '#0056b3', color: 'white', border: 'none', cursor: 'pointer' }}>
            Accept & Share Screen
          </button>
          <button onClick={() => navigate('/')} style={{ padding: '10px 20px', margin: '10px', cursor: 'pointer' }}>
            Cancel Exam
          </button>
        </div>
      );
  }

  const currentQuestion = exam.questions?.[currentQuestionIdx];
  const isAnswered = (idx) => {
    const q = exam.questions?.[idx];
    return q && answers.hasOwnProperty(q._id);
  };

  // Actual Exam UI - Simplified for Performance
  return (
    <div style={{ padding: '20px', fontFamily: 'sans-serif', maxWidth: '800px', margin: '0 auto' }}>
      
      {/* Proctor Message Overlay */}
      {proctorMessage && (
        <div style={{ padding: '15px', background: '#ffebee', border: '2px solid #d32f2f', marginBottom: '20px' }}>
          <h3 style={{ margin: '0 0 10px 0', color: '#d32f2f' }}>Message from Proctor</h3>
          <p style={{ margin: '0 0 15px 0', fontWeight: 'bold' }}>"{proctorMessage}"</p>
          <button onClick={() => setProctorMessage(null)} style={{ padding: '5px 15px' }}>Acknowledge</button>
        </div>
      )}

      {/* Header Info */}
      <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '2px solid #eee', paddingBottom: '10px', marginBottom: '20px' }}>
        <div>
          <h2 style={{ margin: 0 }}>{exam.title}</h2>
          <p style={{ margin: '5px 0 0 0' }}>Question {currentQuestionIdx + 1} of {exam.questions?.length}</p>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '1.2em', fontWeight: 'bold' }}>Time: {formatTime(timeRemaining)}</div>
          <div style={{ fontSize: '0.9em', color: '#666' }}>Answered: {Object.keys(answers).length} / {exam.questions?.length}</div>
        </div>
      </div>

      {/* Active Question Area */}
      <div style={{ minHeight: '300px', marginBottom: '20px' }}>
        {exam.questions?.length === 0 ? (
          <p>No questions available.</p>
        ) : (
          <div>
            <h3 style={{ marginBottom: '20px', lineHeight: '1.5' }}>{currentQuestion?.questionText}</h3>
            
            {(!currentQuestion.type || currentQuestion.type === 'mcq') && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {currentQuestion?.options.map((opt, oIdx) => {
                  const isSelected = answers[currentQuestion._id] === oIdx;
                  return (
                    <label key={oIdx} style={{ display: 'block', padding: '10px', border: '1px solid #ccc', background: isSelected ? '#e3f2fd' : '#fff', cursor: 'pointer' }}>
                      <input 
                        type="radio" 
                        name={`q-${currentQuestion._id}`} 
                        checked={isSelected}
                        onChange={() => handleAnswerSelection(currentQuestion._id, oIdx)}
                        style={{ marginRight: '10px' }}
                      />
                      {String.fromCharCode(65 + oIdx)}. {opt}
                    </label>
                  );
                })}
              </div>
            )}

            {currentQuestion.type === 'text' && (
              <textarea 
                style={{ width: '100%', minHeight: '150px', padding: '10px', fontFamily: 'inherit' }}
                placeholder="Type your answer here..."
                value={answers[currentQuestion._id] || ''}
                onChange={(e) => handleAnswerText(currentQuestion._id, e.target.value)}
              />
            )}

            {currentQuestion.type === 'code' && (
              <textarea 
                style={{ width: '100%', minHeight: '200px', padding: '10px', fontFamily: 'monospace', background: '#f5f5f5' }}
                placeholder="// Write your code here"
                value={answers[currentQuestion._id] || ''}
                onChange={(e) => handleAnswerText(currentQuestion._id, e.target.value)}
              />
            )}
          </div>
        )}
      </div>

      {/* Navigation Controls */}
      <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '2px solid #eee', paddingTop: '20px' }}>
        <button 
          disabled={currentQuestionIdx === 0}
          onClick={() => setCurrentQuestionIdx(idx => idx - 1)}
          style={{ padding: '10px 20px', cursor: currentQuestionIdx === 0 ? 'not-allowed' : 'pointer' }}
        >
          Previous
        </button>

        {currentQuestionIdx === (exam.questions?.length - 1) ? (
          <button onClick={submitExam} style={{ padding: '10px 20px', background: '#0056b3', color: '#fff', border: 'none', cursor: 'pointer', fontWeight: 'bold' }}>
            Submit Exam
          </button>
        ) : (
          <button onClick={() => setCurrentQuestionIdx(idx => idx + 1)} style={{ padding: '10px 20px', cursor: 'pointer' }}>
            Next Question
          </button>
        )}
      </div>

      {/* Emergency Action */}
      <div style={{ textAlign: 'center', marginTop: '20px' }}>
        <button 
          onClick={() => { if(window.confirm("End exam immediately?")) submitExam(); }}
          style={{ background: 'none', border: 'none', color: '#999', textDecoration: 'underline', cursor: 'pointer', fontSize: '0.8em' }}
        >
          Emergency Exit (Submit Current Progress)
        </button>
      </div>

      {/* Proctoring Monitor Bar */}
      <div style={{ marginTop: '40px', padding: '10px', border: '1px solid #ddd', background: '#f9f9f9', display: 'flex', alignItems: 'center', gap: '20px' }}>
        <video 
          ref={videoRef} 
          autoPlay 
          muted 
          onPlay={handleVideoPlay}
          style={{ width: '120px', height: '90px', background: '#000', objectFit: 'cover' }}
        />
        <div style={{ flex: 1 }}>
          <h4 style={{ margin: '0 0 5px 0' }}>Security Monitor</h4>
          <p style={{ margin: '0 0 5px 0', fontSize: '0.9em', color: status.includes('Warning') ? '#d32f2f' : '#2e7d32' }}>
            <strong>Status:</strong> {status}
          </p>
          <p style={{ margin: 0, fontSize: '0.9em' }}>
            <strong>Violations:</strong> <span style={{ color: violations > 0 ? '#d32f2f' : 'inherit' }}>{violations} / 4</span>
          </p>
        </div>
      </div>

    </div>
  );
};

export default ExamSession;
