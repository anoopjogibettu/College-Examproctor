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
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const faceRegistered = user?.hasFaceRegistered || false;

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const headers = { Authorization: `Bearer ${user.token}` };
      try {
        const [examsRes, resultsRes, profileRes] = await Promise.all([
          axios.get(`${import.meta.env.VITE_API_URL}/api/exams`, { headers }),
          axios.get(`${import.meta.env.VITE_API_URL}/api/attempts/my-results`, { headers }),
          axios.get(`${import.meta.env.VITE_API_URL}/api/auth/profile`, { headers })
        ]);

        setExams(examsRes.data);
        setMyResults(resultsRes.data);
        setUsn(resultsRes.data.usn || '');
      } catch (err) {
        console.error("Dashboard fetch error:", err);
      } finally {
        setLoading(false);
      }
    };

    if (user?.token) {
      fetchData();
    }
  }, [user]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto', padding: 'clamp(1rem, 5vw, 3rem) clamp(1rem, 5vw, 2rem)', minHeight: '100vh', display: 'flex', flexDirection: 'column', gap: '2rem' }}>

      {/* HERO HEADER */}
      <header className="flex justify-between items-center animate-fade-in mobile-stack" style={{ paddingBottom: '2rem', borderBottom: '1px solid var(--border)', gap: '1.5rem' }}>
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

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {exams.filter(e => !e.hasAttempted).map(exam => {
              const scheduleDate = new Date(exam.scheduledFor);
              const isFuture = new Date() < scheduleDate;

              return (
                <div key={exam._id} className="card animate-fade-in mobile-stack" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1.5rem', borderLeft: isFuture ? '4px solid var(--border)' : '4px solid var(--primary)', gap: '1.5rem' }}>

                  <div className="flex gap-6 items-center">
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      <h3 style={{ fontSize: '1.35rem', margin: 0 }}>{exam.title}</h3>
                      <div className="flex items-center gap-4 text-sm" style={{ color: 'var(--text-secondary)' }}>
                        <span className="flex items-center gap-1"><Clock size={16} /> {exam.duration} Minutes</span>
                        <span>•</span>
                        <span>{exam.questions?.length || 0} Questions</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-6">
                    {/* Schedule Block */}
                    {isFuture ? (
                      <div className="text-right">
                        <p style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>Opens At</p>
                        <p className="flex items-center gap-2" style={{ color: 'var(--text-primary)', fontWeight: '600', fontSize: '1.1rem' }}>
                          <Calendar size={18} color="var(--primary)" />
                          {scheduleDate.toLocaleDateString()} {scheduleDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    ) : (
                      <div className={`badge ${exam.hasAttempted ? 'badge-terminated' : 'badge-active'} flex items-center gap-1`} style={{ padding: '0.5rem 1rem' }}>
                        <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: exam.hasAttempted ? '#f87171' : '#34d399', display: 'inline-block' }}></span>
                        {exam.hasAttempted ? 'Attempted' : 'Available Now'}
                      </div>
                    )}

                    {/* Action Button */}
                      <button
                        className={`btn ${(isFuture || !faceRegistered || exam.hasAttempted) ? '' : 'btn-primary'}`}
                        style={{
                          width: '100%',
                          maxWidth: '240px',
                          height: '50px',
                          background: (isFuture || exam.hasAttempted) && faceRegistered ? 'var(--surface)' : undefined,
                          border: (isFuture || exam.hasAttempted) && faceRegistered ? '1px solid var(--border)' : undefined,
                          color: (isFuture || exam.hasAttempted) && faceRegistered ? 'var(--text-secondary)' : undefined
                        }}
                        disabled={!faceRegistered || isFuture || exam.hasAttempted}
                        onClick={() => navigate(`/exam/${exam._id}`)}
                      >
                        {!faceRegistered ? 'Setup Required' : exam.hasAttempted ? 'Attempt Recorded' : isFuture ? 'Locked' : 'Initialise Exam'}
                      </button>
                  </div>
                </div>
              );
            })}

            {exams.filter(e => !e.hasAttempted).length === 0 && (
              <div className="card" style={{ padding: '4rem 2rem', textAlign: 'center', background: 'transparent', border: '1px dashed var(--border)' }}>
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
