import React, { useEffect, useState, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { BookOpen, Camera, LogOut, Clock, Calendar, Award } from 'lucide-react';

const Dashboard = () => {
  const { user, logout } = useContext(AuthContext);
  const [exams, setExams] = useState([]);
  const [myResults, setMyResults] = useState(null);
  const [usn, setUsn] = useState('');
  const [faceRegistered, setFaceRegistered] = useState(user?.hasFaceRegistered || false);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchExams = async () => {
      try {
        const { data } = await axios.get(`${import.meta.env.VITE_API_URL}/api/exams`, {
          headers: { Authorization: `Bearer ${user.token}` }
        });
        setExams(data);
      } catch (error) {
        console.error('Failed to fetch exams');
      }
    };
    const fetchResults = async () => {
      try {
        const { data } = await axios.get(`${import.meta.env.VITE_API_URL}/api/attempts/my-results`, {
          headers: { Authorization: `Bearer ${user.token}` }
        });
        setMyResults(data);
        setUsn(data.usn || '');
      } catch (error) {
        console.error('Failed to fetch results');
      }
    };
    const verifyBiometrics = async () => {
      try {
        const { data } = await axios.get(`${import.meta.env.VITE_API_URL}/api/auth/profile`, {
          headers: { Authorization: `Bearer ${user.token}` }
        });
        setFaceRegistered(data.faceEncoding && data.faceEncoding.length > 0);
      } catch (error) {
        console.error('Failed to verify biometrics status');
      }
    };
    fetchExams();
    fetchResults();
    verifyBiometrics();
  }, [user]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '3rem 2rem', minHeight: '100vh', display: 'flex', flexDirection: 'column', gap: '3rem' }}>

      {/* HERO HEADER */}
      <header className="flex justify-between items-center animate-fade-in" style={{ paddingBottom: '2rem', borderBottom: '1px solid var(--border)' }}>
        <div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem', marginBottom: '0.25rem' }}>Welcome back,</p>
          <h1 className="text-gradient" style={{ fontSize: '2.5rem', letterSpacing: '-1px', marginBottom: '0.2rem' }}>{user?.name}</h1>
          {(usn || user?.usn) && (
            <div style={{ color: 'var(--primary)', fontWeight: '700', fontSize: '1.1rem', marginBottom: '1rem', letterSpacing: '1px' }}>
              USN: {usn || user.usn}
            </div>
          )}

          <div className="flex items-center gap-4 mt-3">
            <div className="badge" style={{ background: 'var(--surface)', border: '1px solid var(--border)', padding: '0.4rem 0.8rem', color: 'var(--text-primary)' }}>
              <span style={{ color: 'var(--text-secondary)', marginRight: '0.5rem' }}>UID</span>
              <span style={{ fontFamily: 'monospace', letterSpacing: '2px' }}>{user?.uid || 'LEGACY'}</span>
            </div>
            <div className="badge" style={{ background: 'rgba(9, 82, 155, 0.1)', color: 'var(--primary)', padding: '0.4rem 0.8rem' }}>
              {user?.stream || 'No Stream'} Track
            </div>
            {(user?.branch || user?.specialization) && (
              <div className="badge" style={{ background: 'var(--surface)', border: '1px solid rgba(9, 82, 155, 0.3)', color: 'var(--text-secondary)', padding: '0.4rem 0.8rem' }}>
                {user.branch || user.specialization}
              </div>
            )}
            {user?.year && (
              <div className="badge" style={{ background: 'var(--surface)', border: '1px solid rgba(244, 129, 32, 0.3)', color: 'var(--accent)', padding: '0.4rem 0.8rem' }}>
                Year {user.year}
              </div>
            )}
          </div>
        </div>

        <button className="btn" style={{ background: 'var(--surface)', color: 'var(--text-secondary)', border: '1px solid var(--border)' }} onClick={handleLogout}>
          <LogOut size={18} /> Disconnect
        </button>
      </header>

      <main className="flex" style={{ flexDirection: 'column', gap: '2rem' }}>

        {/* BIOMETRIC STATUS */}
        <div className="card w-full animate-fade-in" style={{ padding: '2rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: faceRegistered ? 'var(--surface)' : 'rgba(79, 70, 229, 0.05)', borderColor: faceRegistered ? 'var(--border)' : 'var(--primary)' }}>
          <div className="flex items-center gap-4">
            <div style={{ padding: '1rem', borderRadius: '50%', background: faceRegistered ? 'rgba(255,255,255,0.05)' : 'var(--primary)' }}>
              <Camera size={28} color={faceRegistered ? 'var(--text-secondary)' : '#fff'} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.25rem', color: faceRegistered ? 'var(--text-primary)' : 'var(--primary)', marginBottom: '0.25rem' }}>
                {faceRegistered ? 'Biometrics Verified' : 'Action Required: Register Biometrics'}
              </h3>
              <p style={{ color: 'var(--text-secondary)', maxWidth: '500px', lineHeight: '1.6' }}>
                {faceRegistered
                  ? 'Your facial geometry is securely encrypted and active for proctoring. You are cleared to begin exams.'
                  : 'You must map your facial geometry to enable AI proctoring before accessing any course materials.'}
              </p>
            </div>
          </div>
          <button
            className={`btn ${faceRegistered ? '' : 'btn-primary'}`}
            style={faceRegistered ? { background: 'transparent', border: '1px solid var(--border)', color: 'var(--text-secondary)' } : { padding: '1rem 2rem' }}
            onClick={() => navigate('/face-setup')}
          >
            {faceRegistered ? 'Re-calibrate' : 'Start Setup Process'}
          </button>
        </div>

        {/* EXAM DIRECTORY */}
        <div>
          <h2 style={{ fontSize: '1.5rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <BookOpen color="var(--primary)" />
            Active Assessments
          </h2>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '2rem' }}>
            {exams.filter(e => !e.hasAttempted).map(exam => {
              const scheduleDate = new Date(exam.scheduledFor);
              const isFuture = new Date() < scheduleDate;

              return (
                <div key={exam._id} className="card glass animate-fade-in" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: '2rem', borderRadius: '20px', border: '1px solid var(--border)', background: 'var(--surface)', transition: 'transform 0.3s, box-shadow 0.3s', position: 'relative', overflow: 'hidden' }} onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-8px)'; e.currentTarget.style.boxShadow = '0 12px 24px rgba(0,0,0,0.1)'; }} onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'var(--shadow)'; }}>
                  
                  {/* Decorative Gradient Background */}
                  <div style={{ position: 'absolute', top: '-50%', left: '-50%', width: '200%', height: '200%', background: 'radial-gradient(circle, rgba(9, 82, 155, 0.05) 0%, transparent 70%)', pointerEvents: 'none' }} />

                  <div>
                    {/* Header */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem', position: 'relative', zIndex: 1 }}>
                      <div style={{ background: 'rgba(9, 82, 155, 0.1)', color: 'var(--primary)', padding: '0.6rem', borderRadius: '12px' }}>
                        <BookOpen size={22} />
                      </div>
                      {isFuture ? (
                        <div className="badge" style={{ background: 'var(--background)', border: '1px solid var(--border)', color: 'var(--text-secondary)', fontSize: '0.75rem', fontWeight: '700' }}>
                          UPCOMING
                        </div>
                      ) : (
                        <div className="badge" style={{ background: 'rgba(16, 185, 129, 0.1)', color: 'var(--secondary)', display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.75rem', fontWeight: '700' }}>
                          <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--secondary)', display: 'inline-block' }}></span>
                          LIVE
                        </div>
                      )}
                    </div>

                    {/* Title */}
                    <h3 style={{ fontSize: '1.4rem', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '0.5rem', lineHeight: '1.3', position: 'relative', zIndex: 1 }}>{exam.title}</h3>
                    
                    {/* Meta Info */}
                    <div style={{ display: 'flex', gap: '1rem', color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '2rem', position: 'relative', zIndex: 1 }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}><Clock size={14} color="var(--primary)" /> {exam.duration}m</span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}><Award size={14} color="var(--primary)" /> {exam.questions?.length || 0} Questions</span>
                    </div>
                  </div>

                  {/* Bottom Section */}
                  <div style={{ position: 'relative', zIndex: 1 }}>
                    {isFuture ? (
                      <div style={{ marginBottom: '1.5rem' }}>
                        <p style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--text-secondary)', marginBottom: '0.25rem', fontWeight: '700' }}>Starts At</p>
                        <p style={{ color: 'var(--text-primary)', fontWeight: '600', fontSize: '0.95rem' }}>
                          {scheduleDate.toLocaleDateString()} {scheduleDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    ) : (
                      <div style={{ marginBottom: '1.5rem', height: '36px' }}>{/* Spacer */}</div>
                    )}

                    <button
                      className={`btn ${(isFuture || !faceRegistered || exam.hasAttempted) ? '' : 'btn-primary'}`}
                      style={{
                        width: '100%',
                        height: '45px',
                        borderRadius: '12px',
                        fontWeight: '600',
                        fontSize: '0.9rem',
                        background: (isFuture || exam.hasAttempted) && faceRegistered ? 'var(--surface-hover)' : undefined,
                        border: (isFuture || exam.hasAttempted) && faceRegistered ? '1px solid var(--border)' : undefined,
                        color: (isFuture || exam.hasAttempted) && faceRegistered ? 'var(--text-secondary)' : undefined,
                        justifyContent: 'center'
                      }}
                      disabled={!faceRegistered || isFuture || exam.hasAttempted}
                      onClick={() => navigate(`/exam/${exam._id}`)}
                    >
                      {!faceRegistered ? 'Setup Required' : exam.hasAttempted ? 'Attempt Recorded' : isFuture ? 'Locked' : 'Start Assessment'}
                    </button>
                  </div>
                </div>
              );
            })}

            {exams.filter(e => !e.hasAttempted).length === 0 && (
              <div className="card" style={{ gridColumn: '1 / -1', padding: '4rem 2rem', textAlign: 'center', background: 'transparent', border: '1px dashed var(--border)', borderRadius: '16px' }}>
                <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem' }}>There are currently no active assessments mapped to your stream.</p>
              </div>
            )}
          </div>
        </div>

        {/* TRANSCRIPT NOTICE */}
        <div className="card animate-fade-in mt-4" style={{ padding: '2rem', background: 'rgba(9, 82, 155, 0.05)', border: '1px solid var(--border)', textAlign: 'center' }}>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
            Looking for your scores? View your detailed performance in the <strong style={{ color: 'var(--primary)', cursor: 'pointer' }} onClick={() => navigate('/results')}>Results Section</strong>.
          </p>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
