import React, { useEffect, useRef, useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import * as faceapi from '@vladmandic/face-api';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import { Camera, CheckCircle, X } from 'lucide-react';

const FaceSetup = () => {
  const videoRef = useRef();
  const canvasRef = useRef();
  const streamRef = useRef();
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [capturing, setCapturing] = useState(false);
  const [status, setStatus] = useState('Initializing models...');
  const { user, updateFaceRegistrationStatus } = useContext(AuthContext);
  const navigate = useNavigate();

  useEffect(() => {
    const loadModels = async () => {
      try {
        await Promise.all([
          faceapi.nets.ssdMobilenetv1.loadFromUri(window.location.origin + '/models'),
          faceapi.nets.faceLandmark68Net.loadFromUri(window.location.origin + '/models'),
          faceapi.nets.faceRecognitionNet.loadFromUri(window.location.origin + '/models')
        ]);
        setModelsLoaded(true);
        setStatus('Ready. Ensure proper lighting and look directly at the camera.');
        startVideo();
      } catch (err) {
        console.error("Model Loading Error:", err);
        setStatus('Failed to load face detection models.');
      }
    };
    loadModels();

    return () => {
      if (streamRef.current) {
         streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const startVideo = () => {
    navigator.mediaDevices.getUserMedia({ video: { width: 640, height: 480 } })
      .then(stream => {
        streamRef.current = stream;
        if (videoRef.current) videoRef.current.srcObject = stream;
      })
      .catch(err => setStatus('Unable to access webcam.'));
  };

  const handleCapture = async () => {
    if (!modelsLoaded || !videoRef.current) return;
    setCapturing(true);
    setStatus('Analyzing face...');

    try {
      const detection = await faceapi.detectSingleFace(videoRef.current)
        .withFaceLandmarks()
        .withFaceDescriptor();

      if (!detection) {
        setStatus('No face detected. Please try again.');
        setCapturing(false);
        return;
      }

      // Send faceDescriptor array to backend
      const encodingArray = Array.from(detection.descriptor);
      await axios.post(`${import.meta.env.VITE_API_URL}/api/auth/face-register`, 
        { faceEncoding: encodingArray },
        { headers: { Authorization: `Bearer ${user.token}` } }
      );

      setStatus('Success! Face registered perfectly.');
      updateFaceRegistrationStatus();
      setTimeout(() => navigate('/'), 2000);

    } catch (err) {
      console.error(err);
      const serverMsg = err.response?.data?.message || err.message || 'Unknown error occurred';
      setStatus(`System Error: ${serverMsg}`);
      setCapturing(false);
    }
  };

  return (
    <div className="main-content flex items-center justify-center">
      <div className="card w-full" style={{ maxWidth: '640px', position: 'relative' }}>
        <button 
          onClick={() => navigate('/')} 
          style={{ position: 'absolute', top: '1.5rem', right: '1.5rem', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', padding: '0.5rem', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          onMouseEnter={e => e.currentTarget.style.background = 'var(--surface-hover)'}
          onMouseLeave={e => e.currentTarget.style.background = 'none'}
          title="Close"
        >
          <X size={20} />
        </button>
        <h2 className="text-gradient">Biometric Registration</h2>
        <p className="mb-4 text-center" style={{ color: 'var(--text-secondary)' }}>
          {status}
        </p>

        <div className="video-container" style={{ minHeight: '480px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {!modelsLoaded ? (
            <div className="animate-fade-in text-center">Loading AI Models...</div>
          ) : (
            <>
              <video 
                ref={videoRef} 
                autoPlay 
                muted 
                className="video-element"
                onPlay={() => {}} 
              />
              <canvas ref={canvasRef} className="canvas-overlay" />
            </>
          )}
        </div>

        <button 
          className="btn btn-primary w-full mt-4 justify-center" 
          disabled={!modelsLoaded || capturing}
          onClick={handleCapture}
        >
          {capturing ? 'Processing...' : <><Camera size={20} /> Capture & Register</>}
        </button>
      </div>
    </div>
  );
};

export default FaceSetup;
