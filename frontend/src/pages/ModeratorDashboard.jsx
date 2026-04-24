import React, { useEffect, useState, useContext } from 'react';
import axios from 'axios';
import { io } from 'socket.io-client';
import { AuthContext } from '../context/AuthContext';
import { LogOut, Activity, AlertCircle, Users, FileText, Shield, MessageSquare } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const ModeratorDashboard = () => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const [logs, setLogs] = useState([]);
  const [attempts, setAttempts] = useState([]);
  const [usersList, setUsersList] = useState([]);
  
  // Tab state
  const [activeTab, setActiveTab] = useState('attempts');

  // Video Modal State
  const [playingVideo, setPlayingVideo] = useState(null);

  const fetchData = async () => {
    const headers = { Authorization: `Bearer ${user.token}` };
    
    try {
      const logsRes = await axios.get('http://localhost:5001/api/admin/logs', { headers });
      setLogs(logsRes.data);
    } catch (err) {
      console.error("Failed to fetch logs", err);
    }
    
    try {
      const attemptsRes = await axios.get('http://localhost:5001/api/admin/attempts', { headers });
      setAttempts(attemptsRes.data);
    } catch (err) {
      console.error("Failed to fetch attempts", err);
    }
    
    try {
      const studentsRes = await axios.get('http://localhost:5001/api/admin/users', { headers });
      setUsersList(studentsRes.data);
    } catch (err) {
      console.error("Failed to fetch users", err);
    }
  };

  const socketRef = React.useRef(null);

  useEffect(() => {
    socketRef.current = io('http://localhost:5001');
    return () => {
      if (socketRef.current) socketRef.current.disconnect();
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [user]);

  const handleSendWarning = (studentId) => {
    const message = prompt('Enter a direct warning/message to send to this student:');
    if (message && message.trim() && socketRef.current) {
      socketRef.current.emit('proctor_message', { roomId: studentId, message });
      alert('Message Dispatched!');
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleAllowRetake = async (attemptId) => {
    if (!window.confirm('Are you sure you want to permanently erase this attempt and all its violation logs? The student will be able to retake the exam.')) return;
    try {
      await axios.delete(`http://localhost:5001/api/admin/attempts/${attemptId}`, {
         headers: { Authorization: `Bearer ${user.token}` }
      });
      fetchData();
    } catch (err) {
      alert('Failed to delete attempt');
    }
  };

  const SidebarButton = ({ id, icon: Icon, label }) => (
    <button
      onClick={() => setActiveTab(id)}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.75rem',
        padding: '0.875rem 1rem',
        borderRadius: '8px',
        border: 'none',
        background: activeTab === id ? 'rgba(79, 70, 229, 0.15)' : 'transparent',
        color: activeTab === id ? 'var(--primary)' : 'var(--text-secondary)',
        cursor: 'pointer',
        fontSize: '0.95rem',
        fontWeight: activeTab === id ? '600' : '500',
        transition: 'all 0.2s',
        width: '100%',
        textAlign: 'left'
      }}
      onMouseEnter={(e) => {
        if(activeTab !== id) {
          e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
          e.currentTarget.style.color = 'var(--text-primary)';
        }
      }}
      onMouseLeave={(e) => {
        if(activeTab !== id) {
          e.currentTarget.style.background = 'transparent';
          e.currentTarget.style.color = 'var(--text-secondary)';
        }
      }}
    >
      <Icon size={18} />
      {label}
    </button>
  );

  const students = usersList.filter(u => u.role === 'student');
  const moderators = usersList.filter(u => u.role === 'moderator');

  return (
    <div style={{ display: 'flex', width: '100%', maxWidth: '1600px', margin: '0 auto', padding: '2rem 4rem', gap: '4rem', minHeight: '100vh', alignItems: 'flex-start' }}>
      
      {/* SIDEBAR NAVIGATION */}
      <aside className="card glass" style={{ width: '280px', flexShrink: 0, position: 'sticky', top: '2rem', display: 'flex', flexDirection: 'column', padding: '1.5rem', height: 'calc(100vh - 4rem)', overflowY: 'auto' }}>
        
        <div style={{ marginBottom: '2rem' }}>
          <h2 className="text-gradient flex items-center gap-2 mb-4" style={{ fontSize: '1.25rem' }}>
            <Activity size={24} /> Moderator Portal
          </h2>
          <div style={{ background: 'var(--background)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--border)' }}>
             <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Welcome back,</p>
             <p style={{ fontWeight: '600', color: 'var(--text-primary)' }}>{user?.name}</p>
             <div className="flex items-center gap-2 mt-2 pt-2" style={{ borderTop: '1px solid var(--border)' }}>
               <Shield size={14} color="var(--primary)" />
               <span style={{ fontSize: '0.75rem', fontFamily: 'monospace', letterSpacing: '1px', color: 'var(--primary)' }}>{user?.uid || 'LEGACY'}</span>
             </div>
             {(user?.stream || user?.specialization) && (
               <div style={{ marginTop: '0.5rem', fontSize: '0.7rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                 {user?.stream} {user?.specialization ? `• ${user?.specialization}` : ''}
               </div>
             )}
          </div>
        </div>

        <nav style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--text-secondary)', marginBottom: '0.5rem', marginTop: '1rem' }}>
            Monitoring
          </div>
          <SidebarButton id="attempts" icon={FileText} label="All Attempts" />
          <SidebarButton id="logs" icon={AlertCircle} label="Violation Logs" />
          <SidebarButton id="students" icon={Users} label="User Directory" />
        </nav>

        <button 
          onClick={handleLogout}
          style={{
            display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem', 
            background: 'transparent', color: 'var(--text-secondary)', border: 'none',
            cursor: 'pointer', transition: 'color 0.2s', marginTop: 'auto', borderRadius: '8px'
          }}
          onMouseEnter={e => e.currentTarget.style.color = 'var(--danger)'}
          onMouseLeave={e => e.currentTarget.style.color = 'var(--text-secondary)'}
        >
          <LogOut size={16} /> Logout out of system
        </button>
      </aside>

      {/* MAIN CONTENT AREA */}
      <main className="card animate-fade-in" style={{ flex: 1, minWidth: 0, minHeight: 'calc(100vh - 4rem)', padding: '2.5rem' }}>
        
        {activeTab === 'attempts' && (
          <div>
            <div className="flex items-center justify-between mb-6">
               <h2 style={{ fontSize: '1.5rem', fontWeight: '600' }}>Student Exam Attempts</h2>
               <div className="badge badge-active">{attempts.length} Total</div>
            </div>
            <table className="w-full text-left" style={{ borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)' }}>
                  <th className="p-3" style={{ color: 'var(--text-secondary)'}}>Student</th>
                  <th className="p-3" style={{ color: 'var(--text-secondary)'}}>Exam</th>
                  <th className="p-3" style={{ color: 'var(--text-secondary)'}}>Track</th>
                  <th className="p-3" style={{ color: 'var(--text-secondary)'}}>Status</th>
                  <th className="p-3" style={{ color: 'var(--text-secondary)'}}>Violations</th>
                  <th className="p-3" style={{ color: 'var(--text-secondary)'}}>Date Started</th>
                  <th className="p-3 text-right" style={{ color: 'var(--text-secondary)'}}>Access Override</th>
                </tr>
              </thead>
              <tbody>
                {attempts.map(attempt => (
                  <tr key={attempt._id} style={{ borderBottom: '1px solid var(--border)', transition: 'background 0.2s' }}>
                    <td className="p-3 font-medium">{attempt.userId?.name} <span style={{color: 'var(--text-secondary)', fontSize: '0.85rem', display: 'block'}}>{attempt.userId?.email}</span></td>
                    <td className="p-3">{attempt.examId?.title}</td>
                    <td className="p-3">
                       <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{attempt.userId?.stream || 'N/A'}</span>
                    </td>
                    <td className="p-3">
                       <span className={`badge ${attempt.status === 'terminated' ? 'badge-terminated' : (attempt.status === 'active' ? 'badge-active' : 'badge-submitted')}`}>
                         {attempt.status.toUpperCase()}
                       </span>
                    </td>
                    <td className="p-3" style={{ color: attempt.violationsCount >= 3 ? 'var(--danger)' : 'inherit', fontWeight: attempt.violationsCount > 0 ? '600' : '400' }}>
                      {attempt.violationsCount}
                    </td>
                    <td className="p-3 text-sm" style={{ color: 'var(--text-secondary)' }}>
                      {new Date(attempt.startedAt).toLocaleString()}
                    </td>
                    <td className="p-3">
                      <div className="flex justify-end gap-2">
                         <button 
                           className="btn" 
                           style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem', background: 'var(--surface-hover)', border: '1px solid var(--border)', color: 'var(--text-primary)' }} 
                           onClick={() => handleSendWarning(attempt.userId._id)}
                         >
                            <MessageSquare size={14} /> Message
                         </button>
                         <button 
                           className="btn btn-danger" 
                           style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem', background: 'transparent', border: '1px solid var(--danger)', color: 'var(--danger)' }} 
                           onClick={() => handleAllowRetake(attempt._id)}
                         >
                            Allow Retake
                         </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {attempts.length === 0 && <tr><td colSpan="6" className="p-8 text-center text-sm" style={{color: 'var(--text-secondary)'}}>No attempts yet.</td></tr>}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'logs' && (
          <div>
            <div className="flex items-center gap-3 mb-6">
              <div style={{ background: 'rgba(239,68,68,0.1)', padding: '0.5rem', borderRadius: '8px' }}>
                <AlertCircle size={24} color="var(--danger)" />
              </div>
              <h2 style={{ fontSize: '1.5rem', fontWeight: '600' }}>Violation Logs</h2>
            </div>
            <table className="w-full text-left" style={{ borderCollapse: 'collapse' }}>
              <thead>
                 <tr style={{ borderBottom: '1px solid var(--border)' }}>
                  <th className="p-3" style={{ color: 'var(--text-secondary)'}}>Timestamp</th>
                  <th className="p-3" style={{ color: 'var(--text-secondary)'}}>Student</th>
                  <th className="p-3" style={{ color: 'var(--text-secondary)'}}>Event Type</th>
                  <th className="p-3" style={{ color: 'var(--text-secondary)'}}>Description</th>
                  <th className="p-3 text-center" style={{ color: 'var(--text-secondary)'}}>Snapshot Media</th>
                </tr>
              </thead>
              <tbody>
                {logs.map(log => (
                  <tr key={log._id} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td className="p-3 text-sm" style={{ color: 'var(--text-secondary)' }}>
                      {new Date(log.timestamp).toLocaleString()}
                    </td>
                    <td className="p-3 font-medium">{log.userId?.name || 'Unknown'}</td>
                    <td className="p-3">
                      <span className="badge" style={{ background: log.eventType.includes('violation') || log.eventType.includes('unknown') || log.eventType.includes('no_face') ? 'rgba(239, 68, 68, 0.1)' : 'rgba(79, 70, 229, 0.1)', color: log.eventType.includes('violation') || log.eventType.includes('unknown') || log.eventType.includes('no_face') ? 'var(--danger)' : 'var(--primary)' }}>
                         {log.eventType.replace('_', ' ').toUpperCase()}
                      </span>
                    </td>
                    <td className="p-3 text-sm" style={{ color: 'var(--text-secondary)' }}>{log.description}</td>
                    <td className="p-3">
                      <div className="flex justify-center">
                        {log.hasSnapshot ? (
                          <button className="btn" style={{ background: 'rgba(79, 70, 229, 0.1)', color: 'var(--primary)', padding: '0.4rem 1rem' }} onClick={async () => {
                            try {
                              const { data } = await axios.get(`http://localhost:5001/api/admin/logs/${log._id}/snapshot`, { headers: { Authorization: `Bearer ${user.token}` } });
                              if (data.snapshotVideo) setPlayingVideo(data.snapshotVideo);
                              else alert('No clip data found for this log.');
                            } catch (e) { alert('Failed to load clip.'); }
                          }}>
                            Play Clip
                          </button>
                        ) : (
                          <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>No Data</span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                {logs.length === 0 && <tr><td colSpan="5" className="p-8 text-center text-sm" style={{color: 'var(--text-secondary)'}}>No logs generated.</td></tr>}
              </tbody>
            </table>

            {/* VIDEO MODAL */}
            {playingVideo && (
              <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.8)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                 <div className="card" style={{ background: 'var(--background)', width: '600px', padding: 0, overflow: 'hidden', position: 'relative' }}>
                    <div style={{ padding: '1rem', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                       <h3 style={{ margin: 0 }}>Incident Snapshot</h3>
                       <button onClick={() => setPlayingVideo(null)} style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', fontSize: '1.2rem', cursor: 'pointer' }}>✕</button>
                    </div>
                    {playingVideo.startsWith('data:image') ? (
                      <img src={playingVideo} alt="Violation" style={{ width: '100%', maxHeight: '400px', objectFit: 'contain', display: 'block' }} />
                    ) : (
                      <video src={playingVideo} controls autoPlay style={{ width: '100%', maxHeight: '400px', display: 'block' }}></video>
                    )}
                 </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'students' && (
          <div>
            {/* MODERATORS TABLE */}
            <div className="flex items-center justify-between mb-4">
               <h2 style={{ fontSize: '1.25rem', fontWeight: '600', color: 'var(--primary)' }}>Moderation Staff</h2>
               <div className="badge" style={{ background: 'rgba(79, 70, 229, 0.1)', color: 'var(--primary)' }}>{moderators.length} Active</div>
            </div>
            <div className="w-full mb-8" style={{ overflowX: 'auto' }}>
              <table className="w-full text-left" style={{ borderCollapse: 'collapse' }}>
                <thead style={{ background: 'var(--background)' }}>
                  <tr style={{ borderBottom: '1px solid var(--border)' }}>
                    <th className="p-3" style={{ color: 'var(--text-secondary)'}}>ID & Name</th>
                    <th className="p-3" style={{ color: 'var(--text-secondary)'}}>Focus / Track</th>
                    <th className="p-3" style={{ color: 'var(--text-secondary)'}}>Biometrics</th>
                    <th className="p-3" style={{ color: 'var(--text-secondary)'}}>Promoted</th>
                  </tr>
                </thead>
                <tbody>
                  {moderators.map(mod => (
                    <tr key={mod._id} style={{ borderBottom: '1px solid var(--border)' }}>
                      <td className="p-3 border-l-2" style={{ borderLeftColor: 'var(--primary)' }}>
                        <div className="font-medium" style={{ fontSize: '1.05rem' }}>{mod.name}</div>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="badge" style={{ background: 'var(--background)', color: 'var(--text-secondary)', fontFamily: 'monospace', padding: '0.1rem 0.4rem' }}>{mod.uid || 'LEGACY'}</span>
                          <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{mod.email}</span>
                        </div>
                      </td>
                      <td className="p-3">
                        <div style={{ fontWeight: '500' }}>{mod.stream}</div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--primary)', fontWeight: 'bold' }}>{mod.specialization || 'General'}</div>
                      </td>
                      <td className="p-3">
                        {mod.hasFaceRegistered 
                          ? <span className="badge badge-active" style={{ background: 'rgba(16, 185, 129, 0.1)' }}>Configured</span> 
                          : <span className="badge badge-terminated" style={{ background: 'var(--background)', color: 'var(--text-secondary)' }}>Pending Setup</span>}
                      </td>
                      <td className="p-3 text-sm" style={{ color: 'var(--text-secondary)' }}>
                        {new Date(mod.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                  {moderators.length === 0 && <tr><td colSpan="3" className="p-8 text-center text-sm" style={{color: 'var(--text-secondary)'}}>No moderators found.</td></tr>}
                </tbody>
              </table>
            </div>

            {/* STUDENTS TABLE */}
            <div className="flex items-center justify-between mb-4 mt-8 pt-4" style={{ borderTop: '1px solid var(--border)' }}>
               <h2 style={{ fontSize: '1.25rem', fontWeight: '600' }}>Standard Students</h2>
               <div className="badge badge-active">{students.length} Total</div>
            </div>
            <div className="w-full" style={{ overflowX: 'auto' }}>
              <table className="w-full text-left" style={{ borderCollapse: 'collapse' }}>
                <thead style={{ background: 'var(--background)' }}>
                  <tr style={{ borderBottom: '1px solid var(--border)' }}>
                    <th className="p-3" style={{ color: 'var(--text-secondary)'}}>ID & Name</th>
                    <th className="p-3" style={{ color: 'var(--text-secondary)'}}>Focus / Track</th>
                    <th className="p-3" style={{ color: 'var(--text-secondary)'}}>Biometrics</th>
                    <th className="p-3" style={{ color: 'var(--text-secondary)'}}>Joined</th>
                  </tr>
                </thead>
                <tbody>
                  {students.map(student => (
                    <tr key={student._id} style={{ borderBottom: '1px solid var(--border)' }}>
                      <td className="p-3">
                        <div className="font-medium" style={{ fontSize: '1.05rem' }}>{student.name}</div>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="badge" style={{ background: 'var(--background)', color: 'var(--text-secondary)', fontFamily: 'monospace', padding: '0.1rem 0.4rem' }}>{student.uid || 'LEGACY'}</span>
                          <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{student.email}</span>
                        </div>
                      </td>
                      <td className="p-3">
                        <div style={{ fontWeight: '500' }}>{student.stream}</div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--primary)', fontWeight: 'bold' }}>{student.specialization || 'General'}</div>
                      </td>
                      <td className="p-3">
                        {student.hasFaceRegistered 
                          ? <span className="badge badge-active" style={{ background: 'rgba(16, 185, 129, 0.1)' }}>Configured</span> 
                          : <span className="badge badge-terminated" style={{ background: 'var(--background)', color: 'var(--text-secondary)' }}>Pending Setup</span>}
                      </td>
                      <td className="p-3 text-sm" style={{ color: 'var(--text-secondary)' }}>
                        {new Date(student.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                  {students.length === 0 && <tr><td colSpan="3" className="p-8 text-center text-sm" style={{color: 'var(--text-secondary)'}}>No students found.</td></tr>}
                </tbody>
              </table>
            </div>

          </div>
        )}
      </main>
    </div>
  );
};

export default ModeratorDashboard;
