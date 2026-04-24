import React, { useEffect, useState, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { BookOpen, Camera, LogOut, Clock, Calendar, Award } from 'lucide-react';

const Dashboard = () => {
  const { user, logout } = useContext(AuthContext);
  const [exams, setExams] = useState([]);
  const [myResults, setMyResults] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchExams = async () => {
      try {
        const { data } = await axios.get('http://localhost:5001/api/exams', {
          headers: { Authorization: `Bearer ${user.token}` }
        });
        setExams(data);
      } catch (error) {
        console.error('Failed to fetch exams');
      }
    };
    const fetchResults = async () => {
      try {
        const { data } = await axios.get('http://localhost:5001/api/attempts/my-results', {
          headers: { Authorization: `Bearer ${user.token}` }
        });
        setMyResults(data);
      } catch (error) {
        console.error('Failed to fetch results');
      }
    };
    fetchExams();
    fetchResults();
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
          <h1 className="text-gradient" style={{ fontSize: '2.5rem', letterSpacing: '-1px' }}>{user?.name}</h1>

          <div className="flex items-center gap-4 mt-3">
            <div className="badge" style={{ background: 'var(--surface)', border: '1px solid var(--border)', padding: '0.4rem 0.8rem', color: 'var(--text-primary)' }}>
              <span style={{ color: 'var(--text-secondary)', marginRight: '0.5rem' }}>UID</span>
              <span style={{ fontFamily: 'monospace', letterSpacing: '2px' }}>{user?.uid || 'LEGACY'}</span>
            </div>
            <div className="badge" style={{ background: 'rgba(79, 70, 229, 0.1)', color: 'var(--primary)', padding: '0.4rem 0.8rem' }}>
              {user?.stream || 'No Stream'} Track
            </div>
            {user?.specialization && (
              <div className="badge" style={{ background: 'var(--surface)', border: '1px solid rgba(79, 70, 229, 0.3)', color: 'var(--text-secondary)', padding: '0.4rem 0.8rem' }}>
                {user.specialization}
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
        <div className="card w-full animate-fade-in" style={{ padding: '2rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: user?.hasFaceRegistered ? 'var(--surface)' : 'rgba(79, 70, 229, 0.05)', borderColor: user?.hasFaceRegistered ? 'var(--border)' : 'var(--primary)' }}>
          <div className="flex items-center gap-4">
            <div style={{ padding: '1rem', borderRadius: '50%', background: user?.hasFaceRegistered ? 'rgba(255,255,255,0.05)' : 'var(--primary)' }}>
              <Camera size={28} color={user?.hasFaceRegistered ? 'var(--text-secondary)' : '#fff'} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.25rem', color: user?.hasFaceRegistered ? 'var(--text-primary)' : 'var(--primary)', marginBottom: '0.25rem' }}>
                {user?.hasFaceRegistered ? 'Biometrics Verified' : 'Action Required: Register Biometrics'}
              </h3>
              <p style={{ color: 'var(--text-secondary)', maxWidth: '500px', lineHeight: '1.6' }}>
                {user?.hasFaceRegistered
                  ? 'Your facial geometry is securely encrypted and active for proctoring. You are cleared to begin exams.'
                  : 'You must map your facial geometry to enable AI proctoring before accessing any course materials.'}
              </p>
            </div>
          </div>
          <button
            className={`btn ${user?.hasFaceRegistered ? '' : 'btn-primary'}`}
            style={user?.hasFaceRegistered ? { background: 'transparent', border: '1px solid var(--border)', color: 'var(--text-secondary)' } : { padding: '1rem 2rem' }}
            onClick={() => navigate('/face-setup')}
          >
            {user?.hasFaceRegistered ? 'Re-calibrate' : 'Start Setup Process'}
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
                <div key={exam._id} className="card animate-fade-in" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1.5rem 2rem', borderLeft: isFuture ? '4px solid var(--border)' : '4px solid var(--primary)' }}>

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
                      className={`btn ${(isFuture || !user?.hasFaceRegistered || exam.hasAttempted) ? '' : 'btn-primary'}`}
                      style={{
                        width: '180px',
                        height: '50px',
                        background: (isFuture || exam.hasAttempted) && user?.hasFaceRegistered ? 'var(--surface)' : undefined,
                        border: (isFuture || exam.hasAttempted) && user?.hasFaceRegistered ? '1px solid var(--border)' : undefined,
                        color: (isFuture || exam.hasAttempted) && user?.hasFaceRegistered ? 'var(--text-secondary)' : undefined
                      }}
                      disabled={!user?.hasFaceRegistered || isFuture || exam.hasAttempted}
                      onClick={() => navigate(`/exam/${exam._id}`)}
                    >
                      {!user?.hasFaceRegistered ? 'Setup Required' : exam.hasAttempted ? 'Attempt Recorded' : isFuture ? 'Locked' : 'Initialise Exam'}
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

        {/* COMPLETED EXAMS DIRECTORY */}
        <div className="mt-4">
          <h2 style={{ fontSize: '1.5rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem', color: 'var(--text-secondary)' }}>
            <Award color="var(--text-secondary)" />
            Academic Transcripts & Results
          </h2>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {/* Online Attempts */}
            {myResults?.attempts?.map(attempt => {
              const isTerminated = attempt.status === 'terminated';
              return (
                <div key={attempt._id} className="card animate-fade-in opacity-90" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1.5rem 2rem', borderLeft: isTerminated ? '4px solid #f87171' : '4px solid #34d399', background: 'var(--surface)' }}>

                  <div className="flex gap-6 items-center">
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      <h3 style={{ fontSize: '1.35rem', margin: 0, color: 'var(--text-primary)' }}>{attempt.examId?.title || 'Unknown Exam'}</h3>
                      <div className="flex items-center gap-4 text-sm" style={{ color: 'var(--text-secondary)' }}>
                        <span className="flex items-center gap-1"><Calendar size={16} /> {new Date(attempt.submittedAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-6 text-right">
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                      <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '1px' }}>{isTerminated ? 'Status' : 'Final Score'}</span>
                      <span style={{ fontSize: isTerminated || !attempt.examId?.resultsPublished ? '1.2rem' : '1.8rem', fontWeight: 'bold', color: isTerminated ? '#f87171' : (!attempt.examId?.resultsPublished ? 'var(--text-secondary)' : 'var(--primary)'), lineHeight: 1 }}>
                        {isTerminated ? 'TERMINATED' : (attempt.examId?.resultsPublished ? `${attempt.score || 0} / ${attempt.examId?.questions?.length || 0}` : 'PENDING RELEASE')}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Offline Manual Results */}
            {myResults?.manualResults && (
              <div className="card animate-fade-in mt-4" style={{ padding: '2.5rem', background: 'var(--surface)', border: '1px dashed var(--border)' }}>
                <h3 style={{ fontSize: '1.05rem', color: 'var(--text-secondary)', marginBottom: '1.2rem', textTransform: 'uppercase', letterSpacing: '2px' }}>Institutional Offline Records</h3>
                <div style={{ whiteSpace: 'pre-wrap', color: 'var(--text-primary)', lineHeight: 1.7, fontSize: '1.1rem' }}>
                  {myResults.manualResults}
                </div>
              </div>
            )}
          </div>
        </div>
        {(!myResults || (myResults?.attempts?.length === 0 && !myResults?.manualResults)) && (
          <div className="card animate-fade-in mt-4" style={{ padding: '3rem', textAlign: 'center', background: 'var(--background)', border: '1px dashed var(--border)' }}>
            <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem' }}>No authenticated transcripts or institutional data mapped to your UID.</p>
          </div>
        )}

      </main>
    </div>
  );
};

export default Dashboard;
