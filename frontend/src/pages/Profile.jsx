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
    <div style={{ minHeight: '100vh', background: 'var(--background)', padding: '2rem' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        
        {/* Header Section */}
        <div className="card" style={{ marginBottom: '2rem', padding: '2rem', background: 'linear-gradient(135deg, var(--primary) 0%, #1e40af 100%)', color: 'white', border: 'none', position: 'relative' }}>
          
          <button 
            onClick={() => { logout(); navigate('/login'); }}
            style={{ 
              position: 'absolute', top: '1.5rem', right: '1.5rem', 
              background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', 
              color: 'white', padding: '0.6rem 1.2rem', borderRadius: '8px', 
              display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer',
              fontWeight: '600', fontSize: '0.85rem', transition: 'background 0.2s'
            }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.2)'}
            onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
          >
            <LogOut size={16} /> Sign Out
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
            <div style={{ width: '100px', height: '100px', background: 'rgba(255,255,255,0.2)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '3rem', fontWeight: 'bold' }}>
              {user.name.charAt(0)}
            </div>
            <div>
              <h1 style={{ margin: 0, fontSize: '2rem', fontWeight: '800' }}>{user.name}</h1>
              <p style={{ margin: '0.25rem 0 0 0', opacity: 0.9, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Mail size={16} /> {user.email}
              </p>
              <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginTop: '1rem' }}>
                <span style={{ padding: '0.4rem 1rem', background: 'rgba(255,255,255,0.15)', borderRadius: '20px', fontSize: '0.85rem', fontWeight: '600' }}>
                  {user.stream || 'Engineering'} • Year {user.year || 1}
                </span>
                <span style={{ padding: '0.4rem 1rem', background: 'rgba(255,255,255,0.15)', borderRadius: '20px', fontSize: '0.85rem', fontWeight: '600' }}>
                  USN: {usn || user.usn || 'PENDING'}
                </span>
                <span style={{ padding: '0.4rem 1rem', background: 'rgba(255,255,255,0.15)', borderRadius: '20px', fontSize: '0.85rem', fontWeight: '600' }}>
                  UID: {user.uid}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 350px', gap: '2rem' }}>
          
          {/* Left Column: Verification */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            <div className="card" style={{ padding: '2rem', background: 'rgba(9, 82, 155, 0.02)' }}>
              <h3 style={{ fontSize: '1rem', fontWeight: '700', marginBottom: '1rem' }}>Institutional Verification</h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div style={{ padding: '1rem', background: 'var(--surface)', borderRadius: '8px', border: '1px solid var(--border)' }}>
                  <p style={{ margin: 0, fontSize: '0.7rem', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: '700' }}>Academic Branch</p>
                  <p style={{ margin: '0.25rem 0 0 0', fontWeight: '600' }}>{user.branch || 'General'}</p>
                </div>
                <div style={{ padding: '1rem', background: 'var(--surface)', borderRadius: '8px', border: '1px solid var(--border)' }}>
                  <p style={{ margin: 0, fontSize: '0.7rem', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: '700' }}>College Details</p>
                  <p style={{ margin: '0.25rem 0 0 0', fontWeight: '600' }}>{user.collegeDetails || 'MITE Campus'}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Announcements */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            <div className="card" style={{ padding: '1.5rem', background: 'var(--surface)' }}>
              <h2 style={{ fontSize: '1.1rem', fontWeight: '700', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Bell size={20} color="var(--secondary)" /> Institutional Feed
              </h2>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                {announcements.length === 0 ? (
                  <p style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '1rem', fontSize: '0.85rem' }}>No new notifications.</p>
                ) : (
                  announcements.map(ann => (
                    <div key={ann._id} style={{ borderBottom: '1px solid var(--border)', paddingBottom: '1rem' }}>
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

            {/* Quick Stats Sidebar */}
            <div className="card" style={{ padding: '1.5rem', background: 'var(--surface)' }}>
               <h3 style={{ fontSize: '0.9rem', fontWeight: '700', marginBottom: '1rem', color: 'var(--text-secondary)' }}>ACTIVITY SUMMARY</h3>
               <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Total Exams Taken</span>
                    <span style={{ fontWeight: '700' }}>{attempts.length}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Published Results</span>
                    <span style={{ fontWeight: '700', color: '#10b981' }}>{attempts.filter(a => a.examId?.resultsPublished).length}</span>
                  </div>
               </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default Profile;
