import React, { useEffect, useState, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import { User, Mail, Award, BookOpen, Clock, Calendar, Bell, ChevronRight, CheckCircle, ShieldAlert, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Profile = () => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const [attempts, setAttempts] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [usn, setUsn] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const headers = { Authorization: `Bearer ${user.token}` };
        const [attemptsRes, annRes] = await Promise.all([
          axios.get(`${import.meta.env.VITE_API_URL}/api/attempts/my-results`, { headers }),
          axios.get(`${import.meta.env.VITE_API_URL}/api/announcements/my`, { headers })
        ]);
        setAttempts(attemptsRes.data.attempts || []);
        setAnnouncements(annRes.data);
        setUsn(attemptsRes.data.usn || '');
      } catch (err) {
        console.error('Failed to fetch profile data', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [user]);

  if (loading) return <div className="flex items-center justify-center min-h-screen">Loading Profile...</div>;

  return (
    <div className="animate-fade-in" style={{ minHeight: '100vh', background: 'var(--background)', padding: '2rem' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        
        {/* Header Section */}
        <div className="card glass" style={{ marginBottom: '2rem', padding: '2.5rem', background: 'linear-gradient(135deg, var(--primary) 0%, #073d75 100%)', color: 'white', border: 'none', position: 'relative', borderRadius: '16px', overflow: 'hidden' }}>
          
          {/* Decorative background shape */}
          <div style={{ position: 'absolute', top: '-50px', right: '-50px', width: '200px', height: '200px', background: 'var(--accent)', opacity: 0.2, borderRadius: '50%', filter: 'blur(40px)' }}></div>
          
          <button 
            onClick={() => { logout(); navigate('/login'); }}
            className="btn"
            style={{ 
              position: 'absolute', top: '1.5rem', right: '1.5rem', 
              background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', 
              color: 'white', backdropFilter: 'blur(4px)'
            }}
          >
            <LogOut size={16} /> Sign Out
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: '2rem', position: 'relative', zIndex: 1 }}>
            <div style={{ 
              width: '100px', height: '100px', 
              background: 'linear-gradient(135deg, var(--accent) 0%, #fff 100%)', 
              borderRadius: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', 
              fontSize: '3.5rem', fontWeight: 'bold', color: 'var(--primary)',
              boxShadow: '0 8px 16px rgba(0,0,0,0.15)',
              transform: 'rotate(-5deg)'
            }}>
              <span style={{ transform: 'rotate(5deg)' }}>{user.name.charAt(0)}</span>
            </div>
            <div>
              <h1 style={{ margin: 0, fontSize: '2.5rem', fontWeight: '800', textShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>{user.name}</h1>
              <p style={{ margin: '0.25rem 0 0 0', opacity: 0.9, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Mail size={16} /> {user.email}
              </p>
              <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginTop: '1.25rem' }}>
                <span className="badge" style={{ background: 'rgba(255,255,255,0.2)', color: 'white' }}>
                  {user.stream || 'Engineering'} • Year {user.year || 1}
                </span>
                <span className="badge" style={{ background: 'rgba(255,255,255,0.2)', color: 'white' }}>
                  USN: {usn || user.usn || 'PENDING'}
                </span>
                <span className="badge" style={{ background: 'rgba(255,255,255,0.2)', color: 'white' }}>
                  UID: {user.uid}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 350px', gap: '2rem' }}>
          
          {/* Left Column: Verification & Stats */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            <div className="card glass" style={{ padding: '2rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem' }}>
                <Award size={24} color="var(--primary)" />
                <h3 style={{ fontSize: '1.25rem', fontWeight: '700', margin: 0 }}>Institutional Verification</h3>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                <div style={{ padding: '1.25rem', background: 'var(--background)', borderRadius: '12px', border: '1px solid var(--border)' }}>
                  <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: '700', letterSpacing: '0.5px' }}>Academic Branch</p>
                  <p style={{ margin: '0.5rem 0 0 0', fontWeight: '600', fontSize: '1rem', color: 'var(--text-primary)' }}>{user.branch || 'General'}</p>
                </div>
                <div style={{ padding: '1.25rem', background: 'var(--background)', borderRadius: '12px', border: '1px solid var(--border)' }}>
                  <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: '700', letterSpacing: '0.5px' }}>College Details</p>
                  <p style={{ margin: '0.5rem 0 0 0', fontWeight: '600', fontSize: '1rem', color: 'var(--text-primary)' }}>{user.collegeDetails || 'MITE Campus'}</p>
                </div>
              </div>
            </div>

            {/* Quick Stats Sidebar (Moved here for better layout) */}
            <div className="card glass" style={{ padding: '2rem' }}>
               <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem' }}>
                 <Clock size={24} color="var(--primary)" />
                 <h3 style={{ fontSize: '1.25rem', fontWeight: '700', margin: 0 }}>Activity Summary</h3>
               </div>
               <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                  <div style={{ padding: '1.25rem', background: 'rgba(9, 82, 155, 0.05)', borderRadius: '12px', textAlign: 'center' }}>
                    <span style={{ fontSize: '2rem', fontWeight: '800', color: 'var(--primary)' }}>{attempts.length}</span>
                    <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: '600', textTransform: 'uppercase' }}>Total Exams</p>
                  </div>
                  <div style={{ padding: '1.25rem', background: 'rgba(16, 185, 129, 0.05)', borderRadius: '12px', textAlign: 'center' }}>
                    <span style={{ fontSize: '2rem', fontWeight: '800', color: 'var(--secondary)' }}>{attempts.filter(a => a.examId?.resultsPublished).length}</span>
                    <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: '600', textTransform: 'uppercase' }}>Results Out</p>
                  </div>
               </div>
            </div>
          </div>

          {/* Right Column: Announcements */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            <div className="card glass" style={{ padding: '1.5rem' }}>
              <h2 style={{ fontSize: '1.1rem', fontWeight: '700', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Bell size={20} color="var(--accent)" /> Institutional Feed
              </h2>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                {announcements.length === 0 ? (
                  <div style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '2rem', fontSize: '0.85rem', background: 'var(--background)', borderRadius: '8px' }}>
                    <p>No new notifications.</p>
                  </div>
                ) : (
                  announcements.map((ann, index) => (
                    <div key={ann._id} style={{ borderBottom: index === announcements.length - 1 ? 'none' : '1px solid var(--border)', paddingBottom: '1rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                        <span style={{ fontSize: '0.7rem', color: 'var(--primary)', fontWeight: '700' }}>OFFICIAL</span>
                        <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>{new Date(ann.createdAt).toLocaleDateString()}</span>
                      </div>
                      <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '0.95rem', fontWeight: '700', color: 'var(--text-primary)' }}>{ann.title}</h4>
                      <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: '1.5' }}>{ann.content}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default Profile;
