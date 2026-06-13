import React, { useEffect, useState, useContext, useRef } from 'react';
import axios from 'axios';
import { io } from 'socket.io-client';
import { AuthContext } from '../context/AuthContext';
import { LogOut, Activity, AlertCircle, Users, PlusCircle, Trash2, StopCircle, Shield, FileText, Settings, User, Award, Search, Eye, EyeOff, MessageSquare, Bell } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const AdminDashboard = () => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const [logs, setLogs] = useState([]);
  const [attempts, setAttempts] = useState([]);
  const [students, setStudents] = useState([]);
  const [exams, setExams] = useState([]);
  
  // Tab state
  const [activeTab, setActiveTab] = useState('attempts');

  // Video Modal State
  const [playingVideo, setPlayingVideo] = useState(null);

  // Create Exam state
  const [examTitle, setExamTitle] = useState('');
  const [examDuration, setExamDuration] = useState('');
  const [scheduledFor, setScheduledFor] = useState('');
  const [examEndTime, setExamEndTime] = useState('');
  const [examStream, setExamStream] = useState('All');
  const [examTargetBranch, setExamTargetBranch] = useState('All');
  const [examTargetYear, setExamTargetYear] = useState(0);
  const [questions, setQuestions] = useState([{ type: 'mcq', questionText: '', options: ['', '', '', ''], correctAnswer: '', marks: '' }]);
  const [individualScores, setIndividualScores] = useState({});

  // Analytics State
  const [analyticsModalOpen, setAnalyticsModalOpen] = useState(false);
  const [analyticsData, setAnalyticsData] = useState([]);

  // Manual Grading State
  const [selectedAttempt, setSelectedAttempt] = useState(null);
  const [manualScore, setManualScore] = useState(0);

  // Socket ref for messaging
  const socketRef = useRef(null);

  // Role Assignment state
  const [targetUid, setTargetUid] = useState('');
  const [targetRole, setTargetRole] = useState('student');

  // Master Student Search & Edit State
  const [searchUid, setSearchUid] = useState('');
  const [searchedStudent, setSearchedStudent] = useState(null);
  const [editFormData, setEditFormData] = useState({
    name: '', email: '', stream: 'Engineering', branch: '', specialization: '', year: 1, usn: '', collegeDetails: ''
  });

  // Announcement state
  const [annTitle, setAnnTitle] = useState('');
  const [annContent, setAnnContent] = useState('');
  const [annStream, setAnnStream] = useState('All');
  const [annBranch, setAnnBranch] = useState('All');
  const [annYear, setAnnYear] = useState(0);
  const [recentAnnouncements, setRecentAnnouncements] = useState([]);
  const [uidSearch, setUidSearch] = useState('');
  const [examSearch, setExamSearch] = useState('');
  const [studentNameFilter, setStudentNameFilter] = useState('');
  const [branchFilter, setBranchFilter] = useState('All');
  const [streamFilter, setStreamFilter] = useState('All');
  const [yearFilter, setYearFilter] = useState(0);

  const [isSyncing, setIsSyncing] = useState(false);

  const fetchData = async () => {
    if (!user || !user.token) return;
    setIsSyncing(true);
    const headers = { Authorization: `Bearer ${user.token}` };
    
    // Fetch each endpoint independently so one failure doesn't block all data
    try {
      const logsRes = await axios.get(`${import.meta.env.VITE_API_URL}/api/admin/logs`, { headers });
      setLogs(logsRes.data);
    } catch (err) {
      console.error("Failed to fetch logs", err);
    }
    
    try {
      const attemptsRes = await axios.get(`${import.meta.env.VITE_API_URL}/api/admin/attempts`, { headers });
      setAttempts(attemptsRes.data);
    } catch (err) {
      console.error("Failed to fetch attempts", err);
    }
    
    try {
      const studentsRes = await axios.get(`${import.meta.env.VITE_API_URL}/api/admin/users`, { headers });
      setStudents(studentsRes.data);
    } catch (err) {
      console.error("Failed to fetch students", err);
    }
    
    try {
      const examsRes = await axios.get(`${import.meta.env.VITE_API_URL}/api/admin/exams`, { headers });
      setExams(examsRes.data);
    } catch (err) {
      console.error("Failed to fetch exams", err);
    }
    setIsSyncing(false);
  };

  useEffect(() => {
    if (user?.token) {
      fetchData();
    }
  }, [user?.token]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const addQuestion = () => {
    setQuestions([...questions, { type: 'mcq', questionText: '', options: ['', '', '', ''], correctAnswer: '', marks: '' }]);
  };

  const openAnalytics = async (examId) => {
    try {
      const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/admin/analytics/${examId}`, {
        headers: { Authorization: `Bearer ${user.token}` }
      });
      setAnalyticsData(res.data);
      setAnalyticsModalOpen(true);
    } catch (err) {
      console.error(err);
      alert('Failed to load analytics.');
    }
  };

  const handleQuestionChange = (index, field, value, optIndex = null) => {
    const updated = [...questions];
    if (field === 'options') {
      updated[index].options[optIndex] = value;
    } else {
      updated[index][field] = field === 'marks' ? parseFloat(value) : value;
    }
    setQuestions(updated);
  };

  const handleCreateExam = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${import.meta.env.VITE_API_URL}/api/exams/create`, 
        { 
          title: examTitle, 
          duration: parseInt(examDuration), 
          scheduledFor, 
          endTime: examEndTime,
          stream: examStream,
          targetBranch: examTargetBranch,
          targetYear: examTargetYear,
          questions
        },
        { headers: { Authorization: `Bearer ${user.token}` } }
      );
      alert('Exam created successfully!');
      setExamTitle('');
      setExamDuration('');
      setScheduledFor('');
      setExamEndTime('');
      setExamStream('All');
      setExamTargetBranch('All');
      setExamTargetYear(0);
      setQuestions([{ type: 'mcq', questionText: '', options: ['', '', '', ''], correctAnswer: '', marks: '' }]);
      fetchData();
      setActiveTab('manageExams');
    } catch (err) {
      alert('Failed to create exam. Ensure all fields are filled.');
    }
  };

  const handleGrantRole = async (e) => {
    e.preventDefault();
    try {
      const { data } = await axios.post(`${import.meta.env.VITE_API_URL}/api/admin/grant-role`, 
        { uid: targetUid, newRole: targetRole },
        { headers: { Authorization: `Bearer ${user.token}` } }
      );
      alert(data.message);
      setTargetUid('');
      fetchData(); 
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update role');
    }
  };

  const handleStudentSearch = async (e) => {
    e.preventDefault();
    if (!searchUid) return;
    try {
      console.log(`Executing search for: "${searchUid}" at ${import.meta.env.VITE_API_URL}/api/admin/search/${searchUid}`);
      const { data } = await axios.get(`${import.meta.env.VITE_API_URL}/api/admin/search/${encodeURIComponent(searchUid.trim())}`, {
        headers: { Authorization: `Bearer ${user.token}` }
      });
      console.log('Search response:', data);
      setSearchedStudent(data);
      const student = data.user;
      setEditFormData({
        name: student.name || '',
        email: student.email || '',
        stream: student.stream || 'Engineering',
        branch: student.branch || '',
        specialization: student.specialization || '',
        year: student.year || 1,
        usn: student.usn || '',
        collegeDetails: student.collegeDetails || ''
      });
    } catch (err) {
      console.error('Search failed:', err);
      const msg = err.response?.data?.message || 'Search failed due to a network or server error.';
      alert(msg);
      setSearchedStudent(null);
    }
  };

  const handleUpdateStudent = async (e) => {
    e.preventDefault();
    try {
      console.log('Deploying profile update:', editFormData);
      const { data } = await axios.put(`${import.meta.env.VITE_API_URL}/api/admin/users/${searchedStudent.user._id}`, editFormData, {
        headers: { Authorization: `Bearer ${user.token}` }
      });
      alert('Student profile perfectly updated.');
      // Update local searched student state to reflect changes immediately
      setSearchedStudent({ ...searchedStudent, user: data.user });
      fetchData();
    } catch (err) {
      console.error('Update failed:', err);
      const msg = err.response?.data?.message || 'Failed to update student profile.';
      alert(msg);
    }
  };

  const handleAllowRetake = async (attemptId) => {
    if (!window.confirm('Are you sure you want to permanently erase this attempt and all its violation logs? The student will be able to retake the exam.')) return;
    try {
      await axios.delete(`${import.meta.env.VITE_API_URL}/api/admin/attempts/${attemptId}`, {
         headers: { Authorization: `Bearer ${user.token}` }
      });
      fetchData();
    } catch (err) {
      alert('Failed to delete attempt');
    }
  };

  const handleSaveGrade = async (e) => {
    e.preventDefault();
    try {
      await axios.put(`${import.meta.env.VITE_API_URL}/api/admin/attempts/${selectedAttempt._id}/grade`,
        { score: manualScore },
        { headers: { Authorization: `Bearer ${user.token}` } }
      );
      setSelectedAttempt(null);
      fetchData();
    } catch (err) {
      console.error('Failed to grade attempt', err);
      alert('Failed to submit grade.');
    }
  };

  const handleSendWarning = (studentId) => {
    if (!socketRef.current) {
      socketRef.current = io(import.meta.env.VITE_API_URL);
    }
    const message = prompt('Enter a direct warning/message to send to this student:');
    if (message && message.trim()) {
      socketRef.current.emit('proctor_message', { roomId: studentId, message });
      alert('Message Dispatched!');
    }
  };

  const handlePostAnnouncement = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${import.meta.env.VITE_API_URL}/api/announcements`, {
        title: annTitle,
        content: annContent,
        targetStream: annStream,
        targetBranch: annBranch,
        targetYear: annYear
      }, {
        headers: { Authorization: `Bearer ${user.token}` }
      });
      setAnnTitle('');
      setAnnContent('');
      alert('Announcement broadcasted successfully.');
      fetchAnnouncements();
    } catch (err) {
      console.error('Failed to post announcement', err);
      alert('Failed to broadcast announcement.');
    }
  };

  const handleDeleteAnnouncement = async (annId) => {
    if (!window.confirm('Are you sure you want to permanently delete this announcement? Students will no longer see it.')) return;
    try {
      await axios.delete(`${import.meta.env.VITE_API_URL}/api/announcements/${annId}`, {
        headers: { Authorization: `Bearer ${user.token}` }
      });
      setRecentAnnouncements(prev => prev.filter(a => a._id !== annId));
    } catch (err) {
      console.error('Failed to delete announcement', err);
      alert('Failed to delete announcement.');
    }
  };

  const fetchAnnouncements = async () => {
    try {
      const { data } = await axios.get(`${import.meta.env.VITE_API_URL}/api/announcements/my`, {
        headers: { Authorization: `Bearer ${user.token}` }
      });
      setRecentAnnouncements(data);
    } catch (err) {
      console.error('Failed to fetch announcements', err);
    }
  };

  useEffect(() => {
    if (activeTab === 'broadcast') fetchAnnouncements();
  }, [activeTab]);

  const handleEndExam = async (examId) => {
    if(!window.confirm("Are you sure you want to end this exam? New students will not be able to start it.")) return;
    try {
      await axios.post(`${import.meta.env.VITE_API_URL}/api/exams/${examId}/end`, {}, {
        headers: { Authorization: `Bearer ${user.token}` }
      });
      fetchData();
    } catch (err) {
      alert("Failed to end exam.");
    }
  };

  const handleDeleteExam = async (examId) => {
    if(!window.confirm("Are you sure you want to permanently delete this exam?")) return;
    try {
      await axios.delete(`${import.meta.env.VITE_API_URL}/api/exams/${examId}`, {
        headers: { Authorization: `Bearer ${user.token}` }
      });
      fetchData();
    } catch (err) {
      alert("Failed to delete exam.");
    }
  };

  const handleTogglePublish = async (examId) => {
    try {
      await axios.put(`${import.meta.env.VITE_API_URL}/api/exams/${examId}/publish`, {}, {
        headers: { Authorization: `Bearer ${user.token}` }
      });
      fetchData();
    } catch (err) {
      alert("Failed to toggle results visibility.");
    }
  };

  // Matches student Dashboard NavItem style
  const SidebarButton = ({ id, icon: Icon, label }) => (
    <div
      onClick={() => setActiveTab(id)}
      style={{
        display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem',
        borderRadius: '12px', cursor: 'pointer', transition: 'background 0.2s',
        fontWeight: activeTab === id ? '700' : '600',
        background: activeTab === id ? 'rgba(9, 82, 155, 0.1)' : 'transparent',
        color: activeTab === id ? 'var(--primary)' : 'var(--text-secondary)',
        userSelect: 'none'
      }}
      onMouseEnter={e => { if (activeTab !== id) e.currentTarget.style.background = 'var(--surface-hover)'; }}
      onMouseLeave={e => { if (activeTab !== id) e.currentTarget.style.background = 'transparent'; }}
    >
      <Icon size={20} />
      <span>{label}</span>
    </div>
  );

  const standardStudents = students.filter(s => s.role === 'student');

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: 'var(--background)' }}>

      {/* ── SIDEBAR ── matches student Dashboard */}
      <aside style={{
        width: '260px', backgroundColor: 'var(--surface)', padding: '2rem 1.5rem',
        display: 'flex', flexDirection: 'column', gap: '2rem',
        borderRight: '1px solid var(--border)', flexShrink: 0,
        position: 'sticky', top: 0, height: '100vh', overflowY: 'auto'
      }}>

        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', paddingLeft: '0.5rem' }}>
          <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Shield size={18} color="white" />
          </div>
          <div>
            <span style={{ fontSize: '1.1rem', fontWeight: '800', letterSpacing: '-0.5px', display: 'block' }}>ProctorAI</span>
            <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '1px' }}>Admin Panel</span>
          </div>
        </div>

        {/* Nav sections */}
        <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', flex: 1 }}>
          <div style={{ fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '1.5px', color: 'var(--text-secondary)', fontWeight: '700', padding: '0 0.5rem', marginBottom: '0.25rem', marginTop: '0.5rem' }}>
            Monitoring
          </div>
          <SidebarButton id="attempts" icon={FileText} label="All Attempts" />
          <SidebarButton id="scores" icon={Award} label="Final Scores" />
          <SidebarButton id="logs" icon={AlertCircle} label="Violation Logs" />
          <SidebarButton id="students" icon={Users} label="Student List" />

          {user?.role === 'admin' && (
            <>
              <div style={{ fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '1.5px', color: 'var(--text-secondary)', fontWeight: '700', padding: '0 0.5rem', marginBottom: '0.25rem', marginTop: '1.25rem' }}>
                Management
              </div>
              <SidebarButton id="manageExams" icon={Settings} label="Manage Exams" />
              <SidebarButton id="createExam" icon={PlusCircle} label="Create Exam" />
              <SidebarButton id="studentLookup" icon={Search} label="Master Search" />
              <SidebarButton id="roles" icon={User} label="Access Control" />
              <SidebarButton id="broadcast" icon={Bell} label="Announcements" />
            </>
          )}
        </nav>

        {/* Logout */}
        <div
          onClick={handleLogout}
          style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem', borderRadius: '12px', color: 'var(--text-secondary)', fontWeight: '600', cursor: 'pointer', transition: 'background 0.2s' }}
          onMouseEnter={e => e.currentTarget.style.background = 'var(--surface-hover)'}
          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
        >
          <LogOut size={20} />
          <span>Disconnect</span>
        </div>
      </aside>

      {/* ── MAIN ── */}
      <main style={{ flex: 1, padding: '2rem 3rem', display: 'flex', flexDirection: 'column', gap: '2rem', overflowY: 'auto', minWidth: 0 }}>

        {/* TOP HEADER BAR */}
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ position: 'relative', width: '280px' }}>
            <Search size={16} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
            <input type="text" placeholder="Search students, exams..." className="input" style={{ paddingLeft: '2.5rem', borderRadius: '999px', background: 'var(--surface)', border: 'none', boxShadow: 'var(--shadow-sm)', fontSize: '0.85rem' }} disabled />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
            {/* Sync button */}
            <button
              onClick={fetchData}
              disabled={isSyncing}
              title="Refresh all data"
              style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '50%', width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'background 0.2s', opacity: isSyncing ? 0.5 : 1 }}
            >
              <Activity size={16} color="var(--primary)" style={{ animation: isSyncing ? 'spin 1s linear infinite' : 'none' }} />
            </button>
            {/* Admin info */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div style={{ textAlign: 'right' }}>
                <p style={{ fontWeight: '600', fontSize: '0.9rem', color: 'var(--text-primary)', margin: 0 }}>{user?.name}</p>
                <p style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', margin: 0, display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '0.3rem' }}>
                  <Shield size={10} /> {user?.uid || 'ADMIN'}
                </p>
              </div>
              <div style={{ width: '42px', height: '42px', borderRadius: '50%', background: 'var(--primary)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '1.1rem', flexShrink: 0 }}>
                {user?.name?.charAt(0) || 'A'}
              </div>
            </div>
          </div>
        </header>

        {/* TAB CONTENT */}
        
        {activeTab === 'attempts' && (
          <div>
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-4">
                  <h2 style={{ fontSize: '1.5rem', fontWeight: '600' }}>Student Exam Attempts</h2>
                  <div style={{ position: 'relative' }}>
                    <Search size={16} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
                    <input 
                      type="text" 
                      placeholder="Filter by Student UID..." 
                      value={uidSearch}
                      onChange={(e) => setUidSearch(e.target.value)}
                      className="input"
                      style={{ padding: '0.5rem 1rem 0.5rem 2.5rem', width: '200px', fontSize: '0.85rem' }}
                    />
                  </div>
                </div>
                <div className="badge badge-active">{attempts.length} Total</div>
            </div>
            <table className="w-full text-left" style={{ borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)' }}>
                  <th className="p-3" style={{ color: 'var(--text-secondary)'}}>Student</th>
                  <th className="p-3" style={{ color: 'var(--text-secondary)'}}>Exam</th>
                  <th className="p-3" style={{ color: 'var(--text-secondary)'}}>Scoring</th>
                  <th className="p-3" style={{ color: 'var(--text-secondary)'}}>Integrity</th>
                  <th className="p-3" style={{ color: 'var(--text-secondary)'}}>Status</th>
                  <th className="p-3" style={{ color: 'var(--text-secondary)'}}>Date Started</th>
                  <th className="p-3 text-right" style={{ color: 'var(--text-secondary)'}}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {attempts.filter(a => !uidSearch || (a.userId?.uid && a.userId.uid.toLowerCase().includes(uidSearch.toLowerCase())) || (a.userId?.email && a.userId.email.toLowerCase().includes(uidSearch.toLowerCase()))).map(attempt => (
                  <tr key={attempt._id} style={{ borderBottom: '1px solid var(--border)', transition: 'background 0.2s' }}>
                    <td className="p-3 font-medium">{attempt.userId?.name} <span style={{color: 'var(--text-secondary)', fontSize: '0.85rem', display: 'block'}}>{attempt.userId?.email} | <strong>{attempt.userId?.uid}</strong></span></td>
                    <td className="p-3">{attempt.examId?.title}</td>
                        <td className="p-3">
                           {(() => {
                             const totalMarks = attempt.examId?.questions?.reduce((acc, q) => acc + (q.marks || 1), 0) || 0;
                             return (
                               <>
                                 <div style={{ fontWeight: '800', color: 'var(--primary)' }}>{attempt.score || 0} / {totalMarks}</div>
                                 <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>
                                   ({((attempt.score / (totalMarks || 1)) * 100).toFixed(1)}%)
                                 </div>
                               </>
                             );
                           })()}
                        </td>
                    <td className="p-3">
                       {(() => {
                         const cheatScore = Math.min(((attempt.violationsCount || 0) / 4) * 100, 100);
                         const riskColor = cheatScore > 50 ? 'var(--danger)' : (cheatScore > 25 ? 'var(--accent)' : 'var(--secondary)');
                         return (
                           <div style={{ minWidth: '100px' }}>
                             <div style={{ width: '100%', background: 'var(--background)', height: '6px', borderRadius: '3px', overflow: 'hidden', marginBottom: '4px' }}>
                                <div style={{ width: `${cheatScore}%`, height: '100%', background: riskColor }}></div>
                             </div>
                             <span style={{ fontSize: '0.7rem', fontWeight: '800', color: riskColor }}>{cheatScore}% CHEAT PROB.</span>
                           </div>
                         );
                       })()}
                    </td>
                    <td className="p-3">
                       <span className={`badge ${attempt.status === 'terminated' ? 'badge-terminated' : (attempt.status === 'active' ? 'badge-active' : 'badge-submitted')}`}>
                         {attempt.status.toUpperCase()}
                       </span>
                    </td>
                    <td className="p-3 text-sm" style={{ color: 'var(--text-secondary)' }}>
                      {new Date(attempt.startedAt).toLocaleString()}
                    </td>
                    <td className="p-3">
                      <div className="flex justify-end gap-2">
                         {attempt.status === 'pending_review' && (
                           <button
                             className="btn"
                             style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem', background: 'var(--primary)', color: '#fff', border: 'none' }}
                             onClick={() => { 
                               setSelectedAttempt(attempt); 
                               setManualScore(attempt.score || 0);
                               setIndividualScores({}); 
                             }}
                           >
                             <FileText size={14} /> Grade
                           </button>
                         )}
                         <button
                           className="btn"
                           style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem', background: 'var(--surface-hover)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
                           onClick={() => handleSendWarning(attempt.userId?._id)}
                         >
                           <MessageSquare size={14} /> Message
                         </button>
                         <button className="btn" style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem', background: 'transparent', border: '1px solid var(--danger)', color: 'var(--danger)' }} onClick={() => handleAllowRetake(attempt._id)}>
                            Allow Retake
                         </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {attempts.length === 0 && <tr><td colSpan="7" className="p-8 text-center text-sm" style={{color: 'var(--text-secondary)'}}>No attempts yet.</td></tr>}
              </tbody>
            </table>

            {/* Admin Grading Modal */}
            {selectedAttempt && (
              <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.85)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div className="card animate-fade-in" style={{ padding: '3rem', maxWidth: '800px', width: '100%', background: 'var(--surface)', maxHeight: '90vh', overflowY: 'auto' }}>
                  <div className="flex justify-between items-center mb-6">
                    <div>
                      <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--text-primary)' }}>Manual Assessment Review</h2>
                      <p style={{ color: 'var(--text-secondary)' }}>Student: <strong>{selectedAttempt.userId?.name}</strong> &mdash; {selectedAttempt.examId?.title}</p>
                    </div>
                    <button className="btn" style={{ border: '1px solid var(--border)' }} onClick={() => setSelectedAttempt(null)}>Close</button>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', marginBottom: '2.5rem' }}>
                    {selectedAttempt.examId?.questions?.map((q, idx) => {
                      const studentAnswer = selectedAttempt.answers?.[q._id];
                      const isOpen = q.type === 'text' || q.type === 'code';
                      if (!isOpen) return null;
                      return (
                        <div key={q._id} style={{ padding: '1.75rem', background: 'var(--background)', borderRadius: '12px', border: '1px solid var(--border)', marginBottom: '1rem' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem', gap: '1rem' }}>
                            <div style={{ flex: 1 }}>
                               <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
                                 <span className="badge badge-active" style={{ fontSize: '0.7rem', fontWeight: '800', background: q.type === 'code' ? '#1e293b' : 'var(--primary)', color: 'white', padding: '0.3rem 0.8rem' }}>{q.type?.toUpperCase()}</span>
                                 <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: '700' }}>QUESTION {idx + 1}</span>
                               </div>
                               <h4 style={{ fontSize: '1.15rem', margin: 0, fontWeight: '700', color: 'var(--text-primary)', lineHeight: '1.4' }}>{q.questionText}</h4>
                            </div>
                            <div style={{ background: 'var(--surface)', padding: '1rem', borderRadius: '10px', border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: '0.5rem', minWidth: '130px', alignItems: 'center' }}>
                               <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', fontWeight: '800', textTransform: 'uppercase' }}>AWARD MARKS</span>
                               <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                 <input 
                                   type="number" 
                                   className="input" 
                                   style={{ width: '70px', padding: '0.5rem', textAlign: 'center', fontSize: '1.1rem', fontWeight: '800' }}
                                   max={q.marks || 1}
                                   min="0"
                                   step="0.5"
                                   value={individualScores[q._id] || ''}
                                   onChange={(e) => {
                                     const val = parseFloat(e.target.value) || 0;
                                     const updated = { ...individualScores, [q._id]: val };
                                     setIndividualScores(updated);
                                     const manualSum = Object.values(updated).reduce((acc, s) => acc + s, 0);
                                     setManualScore((selectedAttempt.score || 0) + manualSum);
                                   }}
                                 />
                                 <span style={{ fontWeight: '700', color: 'var(--text-secondary)' }}>/ {q.marks || 1}</span>
                               </div>
                            </div>
                          </div>
                          <div style={{ padding: '1.5rem', background: '#0f172a', borderRadius: '8px', fontFamily: q.type === 'code' ? 'monospace' : 'inherit', whiteSpace: 'pre-wrap', fontSize: q.type === 'code' ? '0.95rem' : '1.1rem', color: '#e2e8f0', minHeight: '100px', border: '1px solid rgba(255,255,255,0.1)', boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.2)' }}>
                            {studentAnswer || <span style={{ color: '#94a3b8', fontStyle: 'italic' }}>Candidate did not provide a response.</span>}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <form onSubmit={handleSaveGrade} style={{ borderTop: '1px solid var(--border)', paddingTop: '2rem', display: 'flex', alignItems: 'flex-end', gap: '1rem' }}>
                    <div className="form-group flex-1 m-0">
                      <label className="form-label" style={{ color: 'var(--secondary)' }}>Final Score to Assign</label>
                      <input type="number" className="input" value={manualScore} min="0" onChange={e => setManualScore(e.target.value)} required />
                    </div>
                    <button type="submit" className="btn btn-primary" style={{ padding: '0.8rem 2rem', whiteSpace: 'nowrap' }}>Finalize &amp; Save Grade</button>
                  </form>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'scores' && (
          <div>
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-4">
                  <h2 style={{ fontSize: '1.5rem', fontWeight: '600' }}>Finalized Exam Scores</h2>
                  <div style={{ position: 'relative' }}>
                    <Search size={16} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
                    <input 
                      type="text" 
                      placeholder="Search UID..." 
                      value={uidSearch}
                      onChange={(e) => setUidSearch(e.target.value)}
                      className="input"
                      style={{ padding: '0.5rem 1rem 0.5rem 2.5rem', width: '180px', fontSize: '0.85rem' }}
                    />
                  </div>
                </div>
                <div className="badge badge-active">{attempts.filter(a => a.status !== 'active').length} Finalized</div>
            </div>
            <table className="w-full text-left" style={{ borderCollapse: 'collapse' }}>
              <thead>
                 <tr style={{ borderBottom: '1px solid var(--border)' }}>
                  <th className="p-3" style={{ color: 'var(--text-secondary)'}}>Student</th>
                  <th className="p-3" style={{ color: 'var(--text-secondary)'}}>Exam</th>
                  <th className="p-3" style={{ color: 'var(--text-secondary)'}}>Date Submitted</th>
                  <th className="p-3 text-center" style={{ color: 'var(--text-secondary)'}}>Integrity</th>
                  <th className="p-3 text-center" style={{ color: 'var(--text-secondary)'}}>Final Score</th>
                </tr>
              </thead>
              <tbody>
                {attempts.filter(a => a.status !== 'active' && (!uidSearch || (a.userId?.uid && a.userId.uid.toLowerCase().includes(uidSearch.toLowerCase())) || (a.userId?.email && a.userId.email.toLowerCase().includes(uidSearch.toLowerCase())))).map(scoreAttempt => (
                  <tr key={scoreAttempt._id} style={{ borderBottom: '1px solid var(--border)' }}>
                     <td className="p-3 font-medium">
                        {scoreAttempt.userId?.name} <span style={{color: 'var(--text-secondary)', fontSize: '0.85rem', display: 'block'}}>{scoreAttempt.userId?.email} | <strong>{scoreAttempt.userId?.uid}</strong></span>
                     </td>
                     <td className="p-3">{scoreAttempt.examId?.title}</td>
                     <td className="p-3 text-sm" style={{ color: 'var(--text-secondary)' }}>
                       {scoreAttempt.submittedAt ? new Date(scoreAttempt.submittedAt).toLocaleString() : 'Terminated / Unknown'}
                     </td>
                     <td className="p-3">
                        {(() => {
                          const cheatScore = Math.min(((scoreAttempt.violationsCount || 0) / 4) * 100, 100);
                          const riskColor = cheatScore > 50 ? 'var(--danger)' : (cheatScore > 25 ? 'var(--accent)' : 'var(--secondary)');
                          return (
                            <div style={{ textAlign: 'center' }}>
                               <div style={{ fontSize: '0.9rem', fontWeight: '800', color: riskColor }}>{cheatScore}%</div>
                               <div style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', fontWeight: '600' }}>INTEGRITY</div>
                            </div>
                          );
                        })()}
                     </td>
                     <td className="p-3 text-center">
                        {(() => {
                          const totalMarks = scoreAttempt.examId?.questions?.reduce((acc, q) => acc + (q.marks || 1), 0) || 0;
                          return (
                            <>
                              <div style={{ fontWeight: '800', color: 'var(--primary)', fontSize: '1.1rem' }}>{scoreAttempt.score || 0} / {totalMarks}</div>
                              <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>
                                ({((scoreAttempt.score / (totalMarks || 1)) * 100).toFixed(1)}%)
                              </div>
                            </>
                          );
                        })()}
                     </td>
                  </tr>
                ))}
                {attempts.filter(a => a.status !== 'active').length === 0 && <tr><td colSpan="4" className="p-8 text-center text-sm" style={{color: 'var(--text-secondary)'}}>No finalized exams yet.</td></tr>}
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
              <div style={{ position: 'relative', marginLeft: 'auto' }}>
                 <Search size={16} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
                 <input 
                   type="text" 
                   placeholder="Filter by Student UID..." 
                   value={uidSearch}
                   onChange={(e) => setUidSearch(e.target.value)}
                   className="input"
                   style={{ padding: '0.5rem 1rem 0.5rem 2.5rem', width: '220px', fontSize: '0.85rem' }}
                 />
              </div>
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
                {logs.filter(log => !['exam_started', 'exam_submitted', 'exam_terminated'].includes(log.eventType) && (!uidSearch || (log.userId?.uid && log.userId.uid.toLowerCase().includes(uidSearch.toLowerCase())) || (log.userId?.email && log.userId.email.toLowerCase().includes(uidSearch.toLowerCase())))).map(log => (
                  <tr key={log._id} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td className="p-3 text-sm" style={{ color: 'var(--text-secondary)' }}>
                      {new Date(log.timestamp).toLocaleString()}
                    </td>
                    <td className="p-3 font-medium">
                      {log.userId?.name || 'Unknown'}
                      <div style={{ fontSize: '0.75rem', color: 'var(--primary)', fontWeight: '700' }}>UID: {log.userId?.uid || 'N/A'}</div>
                    </td>
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
                              const { data } = await axios.get(`${import.meta.env.VITE_API_URL}/api/admin/logs/${log._id}/snapshot`, { headers: { Authorization: `Bearer ${user.token}` } });
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

            {/* Page header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
              <div style={{ background: 'rgba(9,82,155,0.1)', padding: '0.65rem', borderRadius: '10px' }}>
                <Users size={22} color="var(--primary)" />
              </div>
              <div>
                <h2 style={{ fontSize: '1.5rem', fontWeight: '700', margin: 0 }}>Student List</h2>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: '0.2rem 0 0 0' }}>
                  {standardStudents.filter(s =>
                    (studentNameFilter === '' || s.name?.toLowerCase().includes(studentNameFilter.toLowerCase()) || s.email?.toLowerCase().includes(studentNameFilter.toLowerCase())) &&
                    (branchFilter === 'All' || s.branch === branchFilter) &&
                    (streamFilter === 'All' || s.stream === streamFilter) &&
                    (yearFilter === 0 || s.year === yearFilter)
                  ).length} of {standardStudents.length} students
                </p>
              </div>
            </div>

            {/* Filter bar */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 220px 180px 150px auto', gap: '0.75rem', marginBottom: '1.5rem', alignItems: 'center' }}>
              {/* Name / email search */}
              <div style={{ position: 'relative' }}>
                <Search size={15} style={{ position: 'absolute', left: '0.9rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
                <input
                  type="text"
                  placeholder="Search by name or email..."
                  value={studentNameFilter}
                  onChange={e => setStudentNameFilter(e.target.value)}
                  className="input"
                  style={{ paddingLeft: '2.4rem', borderRadius: '999px', fontSize: '0.85rem' }}
                />
              </div>

              {/* Branch */}
              <select
                className="input"
                value={branchFilter}
                onChange={e => setBranchFilter(e.target.value)}
                style={{ fontSize: '0.85rem', padding: '0.6rem 0.9rem', borderRadius: '999px' }}
              >
                <option value="All">All Branches</option>
                <option value="Computer Science">Computer Science (CSE)</option>
                <option value="Information Science">Information Science (ISE)</option>
                <option value="Electronics & Communication">ECE</option>
                <option value="Electrical & Electronics">EEE</option>
                <option value="Mechanical">Mechanical (ME)</option>
                <option value="Civil">Civil (CE)</option>
                <option value="Artificial Intelligence & ML">AIML</option>
                <option value="Data Science">Data Science</option>
                <option value="Biotechnology">Biotechnology</option>
                <option value="Chemical">Chemical Engineering</option>
              </select>

              {/* Stream */}
              <select
                className="input"
                value={streamFilter}
                onChange={e => setStreamFilter(e.target.value)}
                style={{ fontSize: '0.85rem', padding: '0.6rem 0.9rem', borderRadius: '999px' }}
              >
                <option value="All">All Streams</option>
                <option value="Engineering">Engineering</option>
                <option value="Post Graduation">Post Graduation</option>
              </select>

              {/* Year */}
              <select
                className="input"
                value={yearFilter}
                onChange={e => setYearFilter(parseInt(e.target.value))}
                style={{ fontSize: '0.85rem', padding: '0.6rem 0.9rem', borderRadius: '999px' }}
              >
                <option value={0}>All Years</option>
                <option value={1}>1st Year</option>
                <option value={2}>2nd Year</option>
                <option value={3}>3rd Year</option>
                <option value={4}>4th Year</option>
              </select>

              {/* Clear filters */}
              {(studentNameFilter || branchFilter !== 'All' || streamFilter !== 'All' || yearFilter !== 0) && (
                <button
                  onClick={() => { setStudentNameFilter(''); setBranchFilter('All'); setStreamFilter('All'); setYearFilter(0); }}
                  style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '999px', padding: '0.55rem 1rem', fontSize: '0.8rem', color: 'var(--text-secondary)', cursor: 'pointer', whiteSpace: 'nowrap', transition: 'background 0.2s' }}
                  onMouseEnter={e => e.currentTarget.style.background = 'var(--surface-hover)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'var(--surface)'}
                >
                  ✕ Clear
                </button>
              )}
            </div>

            {/* Table */}
            <div className="w-full" style={{ overflowX: 'auto' }}>
              <table className="w-full text-left" style={{ borderCollapse: 'collapse' }}>
                <thead style={{ background: 'var(--background)' }}>
                  <tr style={{ borderBottom: '1px solid var(--border)' }}>
                    <th className="p-3" style={{ color: 'var(--text-secondary)' }}>ID & Name</th>
                    <th className="p-3" style={{ color: 'var(--text-secondary)' }}>Branch / Stream</th>
                    <th className="p-3" style={{ color: 'var(--text-secondary)' }}>Year</th>
                    <th className="p-3" style={{ color: 'var(--text-secondary)' }}>Biometrics</th>
                    <th className="p-3" style={{ color: 'var(--text-secondary)' }}>Joined</th>
                  </tr>
                </thead>
                <tbody>
                  {standardStudents
                    .filter(s =>
                      (studentNameFilter === '' || s.name?.toLowerCase().includes(studentNameFilter.toLowerCase()) || s.email?.toLowerCase().includes(studentNameFilter.toLowerCase())) &&
                      (branchFilter === 'All' || s.branch === branchFilter) &&
                      (streamFilter === 'All' || s.stream === streamFilter) &&
                      (yearFilter === 0 || s.year === yearFilter)
                    )
                    .map(student => (
                    <tr key={student._id} style={{ borderBottom: '1px solid var(--border)', transition: 'background 0.15s' }}
                      onMouseEnter={e => e.currentTarget.style.background = 'var(--surface-hover)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                    >
                      <td className="p-3">
                        <div className="font-medium" style={{ fontSize: '1rem' }}>{student.name}</div>
                        {student.usn && <div style={{ fontSize: '0.78rem', color: 'var(--primary)', fontWeight: '600', marginBottom: '0.2rem' }}>USN: {student.usn}</div>}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.2rem' }}>
                          <span className="badge" style={{ background: 'var(--background)', color: 'var(--text-secondary)', fontFamily: 'monospace', padding: '0.1rem 0.4rem', fontSize: '0.72rem' }}>{student.uid || 'LEGACY'}</span>
                          <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>{student.email}</span>
                        </div>
                      </td>
                      <td className="p-3">
                        <div style={{ fontWeight: '600', fontSize: '0.9rem' }}>{student.branch || '—'}</div>
                        <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '0.15rem' }}>{student.stream}{student.specialization ? ` · ${student.specialization}` : ''}</div>
                      </td>
                      <td className="p-3">
                        {student.year ? (
                          <span className="badge" style={{ background: 'rgba(9,82,155,0.08)', color: 'var(--primary)', fontWeight: '700', fontSize: '0.78rem' }}>Year {student.year}</span>
                        ) : <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>—</span>}
                      </td>
                      <td className="p-3">
                        {student.hasFaceRegistered
                          ? <span className="badge badge-active" style={{ background: 'rgba(16,185,129,0.1)' }}>Configured</span>
                          : <span className="badge badge-terminated" style={{ background: 'var(--background)', color: 'var(--text-secondary)' }}>Pending</span>}
                      </td>
                      <td className="p-3 text-sm" style={{ color: 'var(--text-secondary)' }}>
                        {new Date(student.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                  {standardStudents.filter(s =>
                    (studentNameFilter === '' || s.name?.toLowerCase().includes(studentNameFilter.toLowerCase()) || s.email?.toLowerCase().includes(studentNameFilter.toLowerCase())) &&
                    (branchFilter === 'All' || s.branch === branchFilter) &&
                    (streamFilter === 'All' || s.stream === streamFilter) &&
                    (yearFilter === 0 || s.year === yearFilter)
                  ).length === 0 && (
                    <tr><td colSpan="5" className="p-8 text-center text-sm" style={{ color: 'var(--text-secondary)' }}>No students match the selected filters.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'studentLookup' && user?.role === 'admin' && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
              <div style={{ background: 'rgba(9,82,155,0.1)', padding: '0.65rem', borderRadius: '10px' }}>
                <Search size={24} color="var(--primary)" />
              </div>
              <div>
                <h2 style={{ fontSize: '1.5rem', fontWeight: '700', margin: 0 }}>Master Lookup & Edit</h2>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: '0.2rem 0 0 0' }}>Search any student by UID or email and edit their records</p>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '360px 1fr', gap: '2rem', alignItems: 'start' }}>
              {/* Search input — left column */}
              <div className="card" style={{ padding: '2rem', position: 'sticky', top: '1rem' }}>
                <h3 style={{ fontSize: '1rem', fontWeight: '700', marginBottom: '1.5rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Find Student</h3>
                <form onSubmit={handleStudentSearch} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                  <div>
                    <label className="form-label" style={{ fontSize: '0.85rem' }}>UID or Email Address</label>
                    <input
                      type="text"
                      className="input uid-code-input"
                      style={{ textAlign: 'center', padding: '0.9rem', fontSize: '1.1rem' }}
                      value={searchUid}
                      onChange={e => setSearchUid(e.target.value)}
                      placeholder="e.g. X9YZ01 or email"
                      required
                    />
                  </div>
                  <button type="submit" className="btn btn-primary" style={{ padding: '0.9rem', fontSize: '1rem' }}>Search</button>
                </form>
              </div>

              {/* Results — right column */}
              <div>

              {!searchedStudent && (
                <div className="card" style={{ padding: '4rem', textAlign: 'center', color: 'var(--text-secondary)', borderStyle: 'dashed' }}>
                  <Search size={36} style={{ margin: '0 auto 1rem', opacity: 0.2, display: 'block' }} />
                  <p>Enter a UID or email to look up a student record.</p>
                </div>
              )}
              {searchedStudent && (
                <>
                <form onSubmit={handleUpdateStudent} className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                  <div className="flex items-center justify-between" style={{ borderBottom: '2px dashed var(--border)', paddingBottom: '1rem' }}>
                    <h3 style={{ fontSize: '1.35rem', color: 'var(--primary)' }}>Core System Identity</h3>
                    <span className="badge badge-active" style={{ padding: '0.4rem 1rem' }}>Identity Locked</span>
                  </div>
                  
                  <div className="grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
                    <div className="form-group m-0">
                      <label className="form-label" style={{ fontSize: '0.95rem' }}>Full Name</label>
                      <input type="text" className="input" style={{ padding: '1rem', fontSize: '1.05rem' }} value={editFormData.name} onChange={e => setEditFormData({...editFormData, name: e.target.value})} required />
                    </div>
                    <div className="form-group m-0">
                      <label className="form-label" style={{ fontSize: '0.95rem' }}>University Seat Number (USN)</label>
                      <input type="text" className="input" style={{ padding: '1rem', fontSize: '1.05rem', border: '1px solid var(--primary)', background: 'rgba(9, 82, 155, 0.02)' }} value={editFormData.usn} onChange={e => setEditFormData({...editFormData, usn: e.target.value})} placeholder="e.g. 4MT20CS001" />
                    </div>
                  </div>

                  <div className="form-group m-0">
                    <label className="form-label" style={{ fontSize: '0.95rem' }}>Email Address</label>
                    <input type="email" className="input" style={{ padding: '1rem', fontSize: '1.05rem' }} value={editFormData.email} onChange={e => setEditFormData({...editFormData, email: e.target.value})} required />
                  </div>

                  <div className="grid mt-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
                    <div className="form-group m-0">
                       <label className="form-label" style={{ fontSize: '0.95rem' }}>Academic Target Stream</label>
                       <select className="input" style={{ padding: '1rem', fontSize: '1.05rem' }} value={editFormData.stream} onChange={e => setEditFormData({...editFormData, stream: e.target.value})}>
                         <option value="Engineering">Engineering</option>
                         <option value="Post Graduation">Post Graduation</option>
                       </select>
                    </div>
                    <div className="form-group m-0">
                       <label className="form-label" style={{ fontSize: '0.95rem' }}>Year</label>
                       <select className="input" style={{ padding: '1rem', fontSize: '1.05rem' }} value={editFormData.year} onChange={e => setEditFormData({...editFormData, year: parseInt(e.target.value)})}>
                         <option value={1}>1st Year</option>
                         <option value={2}>2nd Year</option>
                         <option value={3}>3rd Year</option>
                         <option value={4}>4th Year</option>
                       </select>
                    </div>
                  </div>

                  <div className="grid mt-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
                    <div className="form-group m-0">
                       <label className="form-label" style={{ fontSize: '0.95rem' }}>Branch (Engineering)</label>
                       <select
                         className="input"
                         style={{ padding: '1rem', fontSize: '1.05rem' }}
                         value={editFormData.branch}
                         onChange={e => setEditFormData({...editFormData, branch: e.target.value})}
                       >
                         <option value="">— Select Branch —</option>
                         <option value="Computer Science">Computer Science (CSE)</option>
                         <option value="Information Science">Information Science (ISE)</option>
                         <option value="Electronics & Communication">Electronics & Communication (ECE)</option>
                         <option value="Electrical & Electronics">Electrical & Electronics (EEE)</option>
                         <option value="Mechanical">Mechanical Engineering (ME)</option>
                         <option value="Civil">Civil Engineering (CE)</option>
                         <option value="Artificial Intelligence & ML">Artificial Intelligence & ML (AIML)</option>
                         <option value="Data Science">Data Science (DS)</option>
                         <option value="Biotechnology">Biotechnology (BT)</option>
                         <option value="Chemical">Chemical Engineering (CHE)</option>
                       </select>
                    </div>
                    <div className="form-group m-0">
                       <label className="form-label" style={{ fontSize: '0.95rem' }}>Specialization / PG Program</label>
                       <select
                         className="input"
                         style={{ padding: '1rem', fontSize: '1.05rem' }}
                         value={editFormData.specialization}
                         onChange={e => setEditFormData({...editFormData, specialization: e.target.value})}
                       >
                         <option value="">— Select Specialization —</option>
                         <optgroup label="Post Graduation">
                           <option value="MCA">MCA – Master of Computer Applications</option>
                           <option value="MBA">MBA – Master of Business Administration</option>
                           <option value="M.Tech CSE">M.Tech – Computer Science</option>
                           <option value="M.Tech ECE">M.Tech – Electronics & Communication</option>
                           <option value="M.Tech Power Electronics">M.Tech – Power Electronics</option>
                           <option value="M.Tech Structural Engineering">M.Tech – Structural Engineering</option>
                         </optgroup>
                         <optgroup label="Engineering Electives">
                           <option value="Cybersecurity">Cybersecurity</option>
                           <option value="Cloud Computing">Cloud Computing</option>
                           <option value="Internet of Things">Internet of Things (IoT)</option>
                           <option value="Robotics">Robotics & Automation</option>
                         </optgroup>
                         <optgroup label="General">
                           <option value="None">None / Not Applicable</option>
                         </optgroup>
                       </select>
                    </div>
                  </div>

                  <button type="submit" className="btn btn-primary" style={{ padding: '1rem 3rem', fontSize: '1.1rem', marginTop: '0.5rem', width: '100%' }}>
                    Update Student Details
                  </button>
                </form>
                {/* SEARCH RESULTS: ATTEMPTS & VIOLATIONS */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
                  <div style={{ background: 'var(--surface)', padding: '2rem', borderRadius: '16px', border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <h3 style={{ fontSize: '1.2rem', color: 'var(--primary)', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem' }}>Past Attempts & Scores</h3>
                    <div style={{ maxHeight: '400px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                      {searchedStudent.attempts?.length > 0 ? searchedStudent.attempts.map(a => (
                        <div key={a._id} style={{ padding: '1rem', background: 'var(--background)', borderRadius: '8px', borderLeft: '4px solid var(--primary)' }}>
                          <p style={{ fontWeight: '600', fontSize: '0.95rem' }}>{a.examId?.title || 'Unknown Exam'}</p>
                          <div className="flex justify-between mt-2" style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                            <span>Score: <strong style={{ color: 'var(--primary)' }}>{a.score}</strong></span>
                            <span>{new Date(a.startedAt).toLocaleDateString()}</span>
                          </div>
                        </div>
                      )) : <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', textAlign: 'center' }}>No attempts found.</p>}
                    </div>
                  </div>

                  <div style={{ background: 'var(--surface)', padding: '2rem', borderRadius: '16px', border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <h3 style={{ fontSize: '1.2rem', color: 'var(--danger)', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem' }}>Recorded Violations</h3>
                    <div style={{ maxHeight: '400px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                      {searchedStudent.logs?.length > 0 ? searchedStudent.logs.map(l => (
                        <div key={l._id} style={{ padding: '1rem', background: 'var(--background)', borderRadius: '8px', borderLeft: '4px solid var(--danger)' }}>
                          <p style={{ fontWeight: '600', fontSize: '0.9rem', color: 'var(--danger)' }}>{(l.eventType || 'VIOLATION').toUpperCase().replace('_', ' ')}</p>
                          <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: '0.2rem 0' }}>Exam: {l.attemptId?.examId?.title || 'System Event'}</p>
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{new Date(l.timestamp).toLocaleString()}</span>
                        </div>
                      )) : <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', textAlign: 'center' }}>No violations recorded.</p>}
                    </div>
                  </div>
                </div>
              </>
            )}
            </div>{/* end right column */}
          </div>{/* end grid */}
        </div>
        )}
        {activeTab === 'broadcast' && user?.role === 'admin' && (
          <div className="animate-fade-in">

            {/* Page Header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
              <div style={{ background: 'rgba(244,129,32,0.12)', padding: '0.65rem', borderRadius: '10px' }}>
                <Bell size={24} color="var(--accent)" />
              </div>
              <div>
                <h2 style={{ fontSize: '1.5rem', fontWeight: '700', margin: 0 }}>Broadcast News & Alerts</h2>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: '0.2rem 0 0 0' }}>
                  Compose and send announcements to targeted student groups
                </p>
              </div>
            </div>

            {/* Compose Card — full width */}
            <div className="card" style={{ padding: '2.5rem', marginBottom: '2.5rem' }}>
              <h3 style={{ fontSize: '1.15rem', fontWeight: '700', marginBottom: '2rem', paddingBottom: '1rem', borderBottom: '1px solid var(--border)' }}>
                ✏️ Compose New Announcement
              </h3>
              <form onSubmit={handlePostAnnouncement} style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>

                {/* Title */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <label style={{ fontSize: '0.85rem', fontWeight: '700', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    Announcement Title
                  </label>
                  <input
                    type="text"
                    className="input"
                    style={{ padding: '0.9rem 1.1rem', fontSize: '1rem' }}
                    placeholder="e.g., MCA Semester End Exams Schedule"
                    value={annTitle}
                    onChange={e => setAnnTitle(e.target.value)}
                    required
                  />
                </div>

                {/* Target Audience — 3 columns */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <label style={{ fontSize: '0.85rem', fontWeight: '700', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    Target Audience
                  </label>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
                    <select className="input" style={{ padding: '0.9rem 1rem' }} value={annStream} onChange={e => setAnnStream(e.target.value)}>
                      <option value="All">All Streams</option>
                      <option value="Engineering">Engineering</option>
                      <option value="Post Graduation">Post Graduation</option>
                    </select>
                    <select className="input" style={{ padding: '0.9rem 1rem' }} value={annBranch} onChange={e => setAnnBranch(e.target.value)}>
                      <option value="All">All Branches</option>
                      <option value="Computer Science">CSE – Computer Science</option>
                      <option value="Information Science">ISE – Information Science</option>
                      <option value="Electronics & Communication">ECE – Electronics & Communication</option>
                      <option value="Electrical & Electronics">EEE – Electrical & Electronics</option>
                      <option value="Mechanical">ME – Mechanical</option>
                      <option value="Civil">CE – Civil</option>
                      <option value="Artificial Intelligence & ML">AIML – AI & Machine Learning</option>
                      <option value="Data Science">DS – Data Science</option>
                      <option value="MCA">MCA</option>
                      <option value="MBA">MBA</option>
                    </select>
                    <select className="input" style={{ padding: '0.9rem 1rem' }} value={annYear} onChange={e => setAnnYear(parseInt(e.target.value))}>
                      <option value={0}>All Years</option>
                      <option value={1}>1st Year</option>
                      <option value={2}>2nd Year</option>
                      <option value={3}>3rd Year</option>
                      <option value={4}>4th Year</option>
                    </select>
                  </div>
                </div>

                {/* Content */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <label style={{ fontSize: '0.85rem', fontWeight: '700', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    Detailed Content
                  </label>
                  <textarea
                    className="input"
                    style={{ minHeight: '140px', resize: 'vertical', padding: '0.9rem 1.1rem', fontSize: '0.95rem', lineHeight: '1.6' }}
                    placeholder="Type your announcement message here..."
                    value={annContent}
                    onChange={e => setAnnContent(e.target.value)}
                    required
                  />
                </div>

                {/* Submit */}
                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <button
                    type="submit"
                    className="btn btn-primary"
                    style={{ padding: '0.85rem 2.5rem', fontSize: '1rem', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                  >
                    <Bell size={16} /> Broadcast to Students
                  </button>
                </div>
              </form>
            </div>

            {/* Recent Broadcasts */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
                <h3 style={{ fontSize: '1rem', fontWeight: '700', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '1px', margin: 0 }}>
                  Recent Broadcasts
                </h3>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                  {recentAnnouncements.length} total
                </span>
              </div>

              {recentAnnouncements.length === 0 ? (
                <div className="card" style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '3rem', borderStyle: 'dashed' }}>
                  <Bell size={32} style={{ margin: '0 auto 0.75rem', opacity: 0.25, display: 'block' }} />
                  No announcements broadcasted yet.
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.25rem' }}>
                  {recentAnnouncements.map(ann => (
                    <div
                      key={ann._id}
                      className="card animate-fade-in"
                      style={{ padding: '1.5rem', borderLeft: '4px solid var(--accent)', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}
                    >
                      {/* Header */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.75rem' }}>
                        <h4 style={{ fontSize: '0.95rem', fontWeight: '700', margin: 0, flex: 1, lineHeight: '1.4' }}>{ann.title}</h4>
                        <button
                          onClick={() => handleDeleteAnnouncement(ann._id)}
                          title="Delete announcement"
                          style={{
                            background: 'rgba(239,68,68,0.07)', border: '1px solid rgba(239,68,68,0.18)',
                            borderRadius: '6px', color: 'var(--danger)',
                            width: '30px', height: '30px', flexShrink: 0,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            cursor: 'pointer', transition: 'background 0.2s'
                          }}
                          onMouseEnter={e => e.currentTarget.style.background = 'rgba(239,68,68,0.18)'}
                          onMouseLeave={e => e.currentTarget.style.background = 'rgba(239,68,68,0.07)'}
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>

                      {/* Content */}
                      <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: '1.6', margin: 0 }}>
                        {ann.content}
                      </p>

                      {/* Footer: badges + date */}
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '0.25rem', paddingTop: '0.75rem', borderTop: '1px solid var(--border)' }}>
                        <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                          <span className="badge" style={{ background: 'rgba(244,129,32,0.1)', color: 'var(--accent)', fontSize: '0.65rem', fontWeight: '700' }}>
                            {ann.targetStream === 'All' ? 'All Streams' : ann.targetStream}
                          </span>
                          {ann.targetBranch && ann.targetBranch !== 'All' && (
                            <span className="badge" style={{ background: 'rgba(9,82,155,0.08)', color: 'var(--primary)', fontSize: '0.65rem', fontWeight: '700' }}>
                              {ann.targetBranch}
                            </span>
                          )}
                          {ann.targetYear > 0 && (
                            <span className="badge" style={{ background: 'var(--background)', fontSize: '0.65rem' }}>
                              Year {ann.targetYear}
                            </span>
                          )}
                        </div>
                        <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', flexShrink: 0 }}>
                          {new Date(ann.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}


        {activeTab === 'roles' && user?.role === 'admin' && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
              <div style={{ background: 'rgba(9,82,155,0.1)', padding: '0.65rem', borderRadius: '10px' }}>
                <Shield size={24} color="var(--primary)" />
              </div>
              <div>
                <h2 style={{ fontSize: '1.5rem', fontWeight: '700', margin: 0 }}>Access Control</h2>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: '0.2rem 0 0 0' }}>Manage user roles and access levels using UID or email</p>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', alignItems: 'start' }}>
              {/* Form */}
              <div className="card" style={{ padding: '2rem' }}>
                <h3 style={{ fontSize: '1rem', fontWeight: '700', marginBottom: '1.5rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Assign Role</h3>
                <form onSubmit={handleGrantRole} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                  <div>
                    <label className="form-label" style={{ fontSize: '0.85rem' }}>Target User UID or Email</label>
                    <input
                      type="text"
                      className="input uid-code-input"
                      style={{ textAlign: 'center', padding: '0.9rem', fontSize: '1.1rem' }}
                      value={targetUid}
                      onChange={e => setTargetUid(e.target.value)}
                      required
                      placeholder="UID or Email"
                    />
                  </div>
                  <div>
                    <label className="form-label" style={{ fontSize: '0.85rem' }}>Assign Privilege Level</label>
                    <select className="input" style={{ padding: '0.9rem', fontSize: '1rem' }} value={targetRole} onChange={e => setTargetRole(e.target.value)}>
                      <option value="student">Student — Standard access</option>
                    </select>
                  </div>
                  <button type="submit" className="btn btn-primary" style={{ padding: '0.9rem', fontSize: '1rem', marginTop: '0.5rem' }}>Deploy Protocol</button>
                </form>
              </div>

              {/* Info card */}
              <div className="card" style={{ padding: '2rem', background: 'rgba(9,82,155,0.03)' }}>
                <h3 style={{ fontSize: '1rem', fontWeight: '700', marginBottom: '1.25rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>How Access Control Works</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {[
                    { role: 'student', desc: 'Can take exams, view own results and announcements', color: '#10b981' },
                    { role: 'moderator', desc: 'Can view all attempts, scores and violation logs', color: 'var(--accent)' },
                    { role: 'admin', desc: 'Full system access — create exams, manage users, broadcast', color: 'var(--primary)' },
                  ].map(r => (
                    <div key={r.role} style={{ padding: '1rem 1.25rem', background: 'var(--surface)', borderRadius: '10px', borderLeft: `4px solid ${r.color}` }}>
                      <p style={{ fontWeight: '700', fontSize: '0.9rem', color: r.color, textTransform: 'uppercase', marginBottom: '0.25rem' }}>{r.role}</p>
                      <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>{r.desc}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'manageExams' && user?.role === 'admin' && (
          <div>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{ background: 'rgba(9,82,155,0.1)', padding: '0.65rem', borderRadius: '10px' }}>
                  <Settings size={22} color="var(--primary)" />
                </div>
                <div>
                  <h2 style={{ fontSize: '1.5rem', fontWeight: '700', margin: 0 }}>Manage Exams</h2>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: '0.2rem 0 0 0' }}>{exams.length} exam{exams.length !== 1 ? 's' : ''} in system</p>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                <div style={{ position: 'relative' }}>
                  <Search size={15} style={{ position: 'absolute', left: '0.9rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
                  <input
                    type="text"
                    placeholder="Search exams..."
                    value={examSearch}
                    onChange={e => setExamSearch(e.target.value)}
                    className="input"
                    style={{ paddingLeft: '2.4rem', borderRadius: '999px', fontSize: '0.85rem', width: '220px' }}
                  />
                </div>
                <button className="btn btn-primary" onClick={() => setActiveTab('createExam')} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.7rem 1.4rem' }}>
                  <PlusCircle size={16} /> New Exam
                </button>
              </div>
            </div>

            {/* Analytics Modal */}
            {analyticsModalOpen && (
              <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div className="card animate-fade-in" style={{ padding: '3rem', maxWidth: '800px', width: '100%', background: 'var(--surface)', maxHeight: '80vh', overflowY: 'auto' }}>
                   <div className="flex justify-between items-center mb-6">
                     <h2 style={{ fontSize: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Activity size={24} color="var(--primary)" /> Subject Analytics Heatmap</h2>
                     <button className="btn" onClick={() => setAnalyticsModalOpen(false)}>Close</button>
                   </div>
                   
                   {analyticsData.length === 0 ? (
                      <p className="text-center p-8 form-label">Not enough data to generate analytics yet.</p>
                   ) : (
                      <div style={{ display: 'grid', gap: '1rem' }}>
                         {analyticsData.map((stat, i) => (
                            <div key={i} className="card p-4" style={{ background: 'var(--background)', border: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                               <div>
                                  <div className="badge badge-active mb-2">Question ID: {stat._id}</div>
                                  <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Total Submissions: {stat.totalAttempts}</p>
                               </div>
                               <div style={{ textAlign: 'right' }}>
                                  <p style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', justifyContent: 'flex-end', fontWeight: 'bold' }}><Clock size={14} color="var(--secondary)" /> Avg Time: {stat.averageTimeSpent}s</p>
                                  <p style={{ marginTop: '0.25rem', color: stat.successRate > 60 ? 'var(--primary)' : 'var(--danger)', fontWeight: 'bold' }}>Success Rate: {stat.successRate}%</p>
                               </div>
                            </div>
                         ))}
                      </div>
                   )}
                </div>
              </div>
            )}

            <table className="w-full text-left" style={{ borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)' }}>
                  <th className="p-3" style={{ color: 'var(--text-secondary)'}}>Title & ID</th>
                  <th className="p-3" style={{ color: 'var(--text-secondary)'}}>Configuration</th>
                  <th className="p-3" style={{ color: 'var(--text-secondary)'}}>Duration</th>
                  <th className="p-3" style={{ color: 'var(--text-secondary)'}}>Status</th>
                  <th className="p-3" style={{ color: 'var(--text-secondary)'}}>Questions</th>
                  <th className="p-3 text-right" style={{ color: 'var(--text-secondary)'}}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {exams.filter(e => !examSearch || (e.uid && e.uid.toLowerCase().includes(examSearch.toLowerCase())) || e.title.toLowerCase().includes(examSearch.toLowerCase())).map(exam => (
                  <tr key={exam._id} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td className="p-3 font-medium" style={{ fontSize: '1.05rem' }}>
                       {exam.title}
                       <div style={{ fontSize: '0.75rem', color: 'var(--primary)', fontWeight: '700', fontFamily: 'monospace' }}>UID: {exam.uid || 'LEGACY'}</div>
                    </td>
                    <td className="p-3 text-sm">
                      <div style={{ color: 'var(--text-secondary)' }}>{exam.scheduledFor ? new Date(exam.scheduledFor).toLocaleString() : 'N/A'}</div>
                      <div style={{ color: 'var(--primary)', marginTop: '2px', fontWeight: 'bold' }}>Target: {exam.stream || 'All'}</div>
                    </td>
                    <td className="p-3">{exam.duration}m</td>
                    <td className="p-3">
                       <span className={`badge ${exam.status === 'active' ? 'badge-active' : 'badge-terminated'}`}>
                         {exam.status.toUpperCase()}
                       </span>
                    </td>
                    <td className="p-3 text-sm" style={{ color: 'var(--text-secondary)' }}>{exam.questions?.length || 0} configured</td>
                    <td className="p-3">
                      <div className="flex justify-end gap-2">
                        <button 
                           className="btn" 
                           style={{ background: 'var(--surface-hover)', padding: '0.4rem 0.8rem', color: 'var(--text-primary)', border: '1px solid var(--border)' }}
                           onClick={() => openAnalytics(exam._id)}
                        >
                          <Activity size={16} /> Analytics
                        </button>
                        <button 
                           className="btn" 
                           disabled={exam.status === 'ended'}
                           style={{ background: 'transparent', padding: '0.4rem 0.8rem', color: exam.status === 'ended' ? 'var(--text-secondary)' : 'var(--primary)', border: `1px solid ${exam.status === 'ended' ? 'transparent' : 'var(--primary)'}` }}
                           onClick={() => handleEndExam(exam._id)}
                        >
                          <StopCircle size={16} /> {exam.status === 'ended' ? 'Ended' : 'End Session'}
                        </button>
                        <button 
                           className="btn" 
                           style={{ background: 'transparent', padding: '0.4rem 0.8rem', color: exam.resultsPublished ? 'var(--secondary)' : 'var(--primary)', border: `1px solid ${exam.resultsPublished ? 'var(--secondary)' : 'var(--primary)'}` }}
                           onClick={() => handleTogglePublish(exam._id)}
                           title={exam.resultsPublished ? "Results Published" : "Results Hidden"}
                        >
                          {exam.resultsPublished ? <EyeOff size={16} /> : <Eye size={16} />}
                          {exam.resultsPublished ? 'Hide Results' : 'Publish Results'}
                        </button>
                        <button 
                           className="btn" 
                           style={{ background: 'transparent', padding: '0.4rem 0.8rem', color: 'var(--danger)', border: '1px solid var(--danger)' }}
                           onClick={() => handleDeleteExam(exam._id)}
                        >
                          <Trash2 size={16} /> Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {exams.length === 0 && <tr><td colSpan="5" className="p-8 text-center text-sm" style={{color: 'var(--text-secondary)'}}>No exams created yet.</td></tr>}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'createExam' && user?.role === 'admin' && (
          <div>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
              <div style={{ background: 'rgba(9,82,155,0.1)', padding: '0.65rem', borderRadius: '10px' }}>
                <PlusCircle size={22} color="var(--primary)" />
              </div>
              <div>
                <h2 style={{ fontSize: '1.5rem', fontWeight: '700', margin: 0 }}>Create New Exam</h2>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: '0.2rem 0 0 0' }}>Configure exam settings and add questions below</p>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', marginBottom: '2rem' }}>
              {/* Left: basic config */}
              <div className="card" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                <h3 style={{ fontSize: '1rem', fontWeight: '700', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px', margin: 0 }}>Exam Configuration</h3>
                <form id="create-exam-form" onSubmit={handleCreateExam} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                  <div className="form-group m-0">
                    <label className="form-label">Exam Title</label>
                    <input type="text" className="input" style={{ fontSize: '1rem', padding: '0.8rem 1rem' }} value={examTitle} onChange={e => setExamTitle(e.target.value)} required placeholder="e.g. CS101 Midterm" />
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div className="form-group m-0">
                      <label className="form-label">Scheduled Start</label>
                      <input type="datetime-local" className="input" style={{ fontSize: '1rem', padding: '0.8rem 1rem' }} value={scheduledFor} onChange={e => setScheduledFor(e.target.value)} required />
                    </div>
                    <div className="form-group m-0">
                      <label className="form-label">Scheduled End</label>
                      <input type="datetime-local" className="input" style={{ fontSize: '1rem', padding: '0.8rem 1rem' }} value={examEndTime} onChange={e => setExamEndTime(e.target.value)} required />
                    </div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 130px', gap: '1rem' }}>
                    <div className="form-group m-0">
                      <label className="form-label">Target Stream</label>
                      <select className="input" style={{ fontSize: '1rem', padding: '0.8rem 1rem' }} value={examStream} onChange={e => { setExamStream(e.target.value); setExamTargetBranch('All'); setExamTargetYear(0); }}>
                        <option value="All">All Students (Universal)</option>
                        <option value="Engineering">Engineering (B.E.)</option>
                        <option value="Post Graduation">Post Graduation</option>
                      </select>
                    </div>
                    <div className="form-group m-0">
                      <label className="form-label">Duration (min)</label>
                      <input type="number" min="1" className="input" style={{ fontSize: '1rem', padding: '0.8rem 1rem' }} value={examDuration} onChange={e => setExamDuration(e.target.value)} required />
                    </div>
                  </div>

                  {/* Branch + Year — only shown when stream ≠ All */}
                  {examStream !== 'All' && (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 160px', gap: '1rem' }}>
                      <div className="form-group m-0">
                        <label className="form-label">{examStream === 'Engineering' ? 'Target Branch' : 'Target PG Programme'}</label>
                        <select className="input" style={{ fontSize: '1rem', padding: '0.8rem 1rem' }} value={examTargetBranch} onChange={e => setExamTargetBranch(e.target.value)}>
                          <option value="All">All {examStream === 'Engineering' ? 'Branches' : 'Programmes'}</option>
                          {examStream === 'Engineering' ? (
                            <>
                              <option>Aeronautical Engineering</option>
                              <option>Computer Science & Engineering</option>
                              <option>Artificial Intelligence & Machine Learning</option>
                              <option>CSE (IoT & Cyber Security with Blockchain Technology)</option>
                              <option>CSE (Artificial Intelligence & Machine Learning)</option>
                              <option>Information Science & Engineering</option>
                              <option>Electronics & Communication Engineering</option>
                              <option>Mechanical Engineering</option>
                              <option>Mechatronics</option>
                              <option>Robotics and Artificial Intelligence</option>
                              <option>Civil Engineering</option>
                            </>
                          ) : (
                            <>
                              <option>Master of Computer Applications (MCA)</option>
                              <option>Master of Business Administration (MBA)</option>
                              <option>Master of Technology (M.Tech) in Computer Science & Engg.</option>
                            </>
                          )}
                        </select>
                      </div>
                      <div className="form-group m-0">
                        <label className="form-label">Target Year</label>
                        <select className="input" style={{ fontSize: '1rem', padding: '0.8rem 1rem' }} value={examTargetYear} onChange={e => setExamTargetYear(parseInt(e.target.value))}>
                          <option value={0}>All Years</option>
                          <option value={1}>1st Year</option>
                          <option value={2}>2nd Year</option>
                          {examStream === 'Engineering' && <option value={3}>3rd Year</option>}
                          {examStream === 'Engineering' && <option value={4}>4th Year</option>}
                        </select>
                      </div>
                    </div>
                  )}
                </form>
              </div>

              {/* Right: summary preview */}
              <div className="card" style={{ padding: '2rem', background: 'rgba(9,82,155,0.02)', height: 'fit-content' }}>
                <h3 style={{ fontSize: '1rem', fontWeight: '700', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '1.5rem' }}>Exam Summary</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {[
                    { label: 'Title', value: examTitle || '—' },
                    { label: 'Start Time', value: scheduledFor ? new Date(scheduledFor).toLocaleString() : '—' },
                    { label: 'End Time', value: examEndTime ? new Date(examEndTime).toLocaleString() : '—' },
                    { label: 'Duration', value: examDuration ? `${examDuration} minutes` : '—' },
                    { label: 'Target', value: examStream === 'All' ? 'All Students' : `${examStream}${examTargetBranch !== 'All' ? ` › ${examTargetBranch}` : ''}${examTargetYear > 0 ? ` (Year ${examTargetYear})` : ''}` },
                    { label: 'Questions', value: `${questions.length} configured` },
                  ].map(row => (
                    <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.65rem 0', borderBottom: '1px solid var(--border)' }}>
                      <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', fontWeight: '600', textTransform: 'uppercase' }}>{row.label}</span>
                      <span style={{ fontSize: '0.88rem', fontWeight: '700', color: 'var(--text-primary)', textAlign: 'right', maxWidth: '60%' }}>{row.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Questions section — full width */}
            <form onSubmit={handleCreateExam}>
                <h4 className="mb-4 flex items-center gap-2" style={{ color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '1px', fontSize: '0.85rem' }}>
                  Question Blueprint
                </h4>
                
                {questions.map((q, qIndex) => (
                  <div key={qIndex} className="pb-6 mb-8" style={{ border: '1px solid var(--border)', borderRadius: '16px', padding: '1.75rem', position: 'relative', background: 'var(--surface)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                       <div style={{ background: 'var(--primary)', color: 'white', padding: '0.4rem 1rem', borderRadius: '8px', fontSize: '0.75rem', fontWeight: '800' }}>
                         QUESTION {qIndex + 1}
                       </div>
                       <button type="button" onClick={() => removeQuestion(qIndex)} style={{ color: 'var(--danger)', background: 'transparent', border: 'none', fontSize: '0.8rem', fontWeight: '700', cursor: 'pointer' }}>
                         Remove Question
                       </button>
                    </div>
                    
                    <div style={{ display: 'flex', gap: '1.5rem' }}>
                      <div className="form-group mt-2 mb-4 flex-1">
                        <label className="form-label" style={{ fontSize: '0.85rem' }}>Question Format / Type</label>
                        <select 
                          className="input"
                          style={{ background: 'var(--background)', fontSize: '1rem', padding: '0.5rem 1rem' }}
                          value={q.type || 'mcq'}
                          onChange={(e) => handleQuestionChange(qIndex, 'type', e.target.value)}
                        >
                           <option value="mcq">Standard: Multiple Choice</option>
                           <option value="text">Subjective: Short Text / Essay</option>
                           <option value="code">Technical: Code Submission</option>
                        </select>
                      </div>
                      <div className="form-group mt-2 mb-4" style={{ width: '120px' }}>
                        <label className="form-label" style={{ fontSize: '0.85rem' }}>Marks</label>
                        <input 
                          type="number" 
                          min="0.5" 
                          step="0.5"
                          className="input"
                          style={{ background: 'var(--background)', fontSize: '1rem', padding: '0.5rem 1rem' }}
                          value={q.marks}
                          onChange={(e) => handleQuestionChange(qIndex, 'marks', e.target.value)}
                        />
                      </div>
                    </div>

                    <div className="form-group mt-2">
                      <label className="form-label" style={{ display: 'none' }}>Question Text</label>
                      <input 
                        type="text" 
                        className="input" 
                        placeholder="Enter the main question syntax here..."
                        style={{ fontSize: '1.1rem', borderTop: 'none', borderLeft: 'none', borderRight: 'none', borderRadius: 0, paddingLeft: 0, paddingRight: 0, background: 'transparent' }}
                        value={q.questionText} 
                        onChange={(e) => handleQuestionChange(qIndex, 'questionText', e.target.value)} 
                        required 
                      />
                    </div>
                    
                    {(!q.type || q.type === 'mcq') ? (
                       <>
                          <div className="grid mt-6" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                            {q.options.map((opt, optIndex) => (
                              <div className="form-group m-0 flex items-center gap-3" key={optIndex}>
                                <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: 'var(--background)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', color: 'var(--text-secondary)', border: '1px solid var(--border)' }}>
                                  {String.fromCharCode(65 + optIndex)}
                                </div>
                                <input 
                                  type="text" 
                                  className="input flex-1" 
                                  placeholder={`Option text`} 
                                  value={opt} 
                                  onChange={(e) => handleQuestionChange(qIndex, 'options', e.target.value, optIndex)} 
                                  required={!q.type || q.type === 'mcq'}
                                />
                              </div>
                            ))}
                          </div>

                          <div className="form-group mt-6 p-4 rounded" style={{ background: 'var(--background)', border: '1px dashed rgba(16, 185, 129, 0.4)' }}>
                            <label className="form-label" style={{ color: 'var(--secondary)' }}>Correct Answer String</label>
                            <input 
                              type="text" 
                              className="input" 
                              style={{ borderColor: 'var(--secondary)' }}
                              placeholder="Must identically match one of the options"
                              value={q.correctAnswer} 
                              onChange={(e) => handleQuestionChange(qIndex, 'correctAnswer', e.target.value)} 
                              required={!q.type || q.type === 'mcq'}
                            />
                          </div>
                      </>
                    ) : (
                       <div className="mt-4 p-4 rounded" style={{ background: 'var(--surface-hover)', border: '1px dashed var(--border)', textAlign: 'center' }}>
                         <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>This is an open-ended format. The interface will adapt during the exam. Submissions will be sent to the "Pending Manual Review" queue.</p>
                       </div>
                    )}
                  </div>
                ))}

                <button type="button" className="btn" style={{ border: '1px dashed var(--primary)', color: 'var(--primary)', width: '100%', padding: '1rem', background: 'rgba(79, 70, 229, 0.05)', marginBottom: '2rem' }} onClick={addQuestion}>
                  <PlusCircle size={18} /> Append Another Question
                </button>

              {/* Sticky publish footer */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', bottom: '0', padding: '1.5rem 0', borderTop: '2px solid var(--border)', zIndex: 10, marginTop: '2rem', background: 'var(--background)' }}>
                <div>
                  <p style={{ fontWeight: 'bold', fontSize: '1.1rem', margin: 0 }}>Ready to deploy?</p>
                  <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', margin: '0.25rem 0 0' }}>Instantly pushes to all Student client apps.</p>
                  <p style={{ fontSize: '0.82rem', color: 'var(--danger)', fontWeight: 'bold', marginTop: '0.4rem', borderLeft: '3px solid var(--danger)', paddingLeft: '0.5rem' }}>
                    ⚠️ ONCE PUBLISHED, EXAMS CANNOT BE EDITED!
                  </p>
                </div>
                <button type="submit" className="btn btn-primary" style={{ padding: '1rem 2.5rem', fontSize: '1.05rem', boxShadow: 'var(--shadow-glow)' }}>
                  Publish Exam Live
                </button>
              </div>

            </form>
          </div>
        )}

      </main>
    </div>
  );
};

export default AdminDashboard;
