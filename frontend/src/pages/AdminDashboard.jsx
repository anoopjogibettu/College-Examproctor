import React, { useEffect, useState, useContext, useRef } from 'react';
import axios from 'axios';
import { io } from 'socket.io-client';
import { AuthContext } from '../context/AuthContext';
import { LogOut, Activity, AlertCircle, Users, PlusCircle, Trash2, StopCircle, Shield, FileText, Settings, User, Award, Search, Eye, EyeOff, MessageSquare, Bell, Menu } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const ENGINEERING_BRANCHES = [
  'Aeronautical Engineering',
  'Computer Science & Engineering',
  'Artificial Intelligence & Machine Learning',
  'CSE (IoT & Cyber Security with Blockchain Technology)',
  'CSE (Artificial Intelligence & Machine Learning)',
  'Information Science & Engineering',
  'Electronics & Communication Engineering',
  'Mechanical Engineering',
  'Mechatronics',
  'Robotics and Artificial Intelligence',
  'Civil Engineering',
];

const PG_PROGRAMS = [
  'Master of Computer Applications (MCA)',
  'Master of Business Administration (MBA)',
  'Master of Technology (M.Tech) in Computer Science & Engg.',
];

const AdminDashboard = () => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const [logs, setLogs] = useState([]);
  const [attempts, setAttempts] = useState([]);
  const [students, setStudents] = useState([]);
  const [exams, setExams] = useState([]);
  
  // Tab state
  // Tab state
  const [activeTab, setActiveTab] = useState('overview');

  // Video Modal State
  const [playingVideo, setPlayingVideo] = useState(null);

  // Create Exam state
  const [examTitle, setExamTitle] = useState('');
  const [examDuration, setExamDuration] = useState(10);
  const [scheduledFor, setScheduledFor] = useState('');
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
  const [targetRole, setTargetRole] = useState('moderator');

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

  const [isSyncing, setIsSyncing] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const fetchData = async () => {
    if (!user || !user.token) return;
    setIsSyncing(true);
    const headers = { Authorization: `Bearer ${user.token}` };
    
    try {
      const [logsRes, attemptsRes, studentsRes, examsRes] = await Promise.all([
        axios.get(`${import.meta.env.VITE_API_URL}/api/admin/logs`, { headers }),
        axios.get(`${import.meta.env.VITE_API_URL}/api/admin/attempts`, { headers }),
        axios.get(`${import.meta.env.VITE_API_URL}/api/admin/users`, { headers }),
        axios.get(`${import.meta.env.VITE_API_URL}/api/admin/exams`, { headers })
      ]);

      setLogs(logsRes.data);
      setAttempts(attemptsRes.data);
      setStudents(studentsRes.data);
      setExams(examsRes.data);
    } catch (err) {
      console.error("Data fetch error:", err);
    } finally {
      setIsSyncing(false);
    }
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
          duration: examDuration, 
          questions, 
          scheduledFor, 
          stream: examStream,
          targetBranch: examTargetBranch,
          targetYear: examTargetYear
        },
        { headers: { Authorization: `Bearer ${user.token}` } }
      );
      alert('Exam created successfully!');
      setExamTitle('');
      setExamDuration(10);
      setScheduledFor('');
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
  const standardStudents = students.filter(s => s.role === 'student');
  const moderators = students.filter(s => s.role === 'moderator');

  return (
    <div style={{ display: 'flex', width: '100%', maxWidth: '1600px', margin: '0 auto', padding: '2rem 4rem', gap: '4rem', minHeight: '100vh', alignItems: 'flex-start' }} className="mobile-dashboard-container">
      {/* SIDEBAR NAVIGATION */}
      <aside 
        className={`card glass ${sidebarOpen ? 'sidebar-open' : ''}`}
        style={{ 
          width: '280px', 
          flexShrink: 0, 
          position: 'sticky', 
          top: '6rem', 
          display: 'flex', 
          flexDirection: 'column', 
          padding: '1.5rem', 
          height: 'calc(100vh - 8rem)', 
          overflowY: 'auto',
          zIndex: 100,
          transition: 'transform 0.3s ease'
        }}
      >
        
        <div style={{ marginBottom: '2rem' }}>
          <h2 className="text-gradient flex items-center gap-2 mb-4" style={{ fontSize: '1.25rem' }}>
            <Activity size={24} /> {user?.role === 'admin' ? 'Admin Panel' : 'Moderator'}
          </h2>
          <div style={{ background: 'var(--background)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--border)', position: 'relative' }}>
             <button 
               onClick={fetchData}
               disabled={isSyncing}
               style={{ 
                 position: 'absolute', top: '0.5rem', right: '0.5rem', 
                 background: 'transparent', border: 'none', color: 'var(--primary)', 
                 cursor: 'pointer', opacity: isSyncing ? 0.5 : 1 
               }}
               title="Refresh Data"
             >
               <Activity size={14} className={isSyncing ? 'animate-spin' : ''} />
             </button>
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
          <SidebarButton id="overview" icon={Activity} label="Insights Overview" />
          <SidebarButton id="attempts" icon={FileText} label="All Attempts" />
          <SidebarButton id="scores" icon={Award} label="Final Scores" />
          <SidebarButton id="logs" icon={AlertCircle} label="Violation Logs" />
          <SidebarButton id="students" icon={Users} label="Student List" />
          
          {user?.role === 'admin' && (
            <>
              <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--text-secondary)', marginBottom: '0.5rem', marginTop: '1.5rem' }}>
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
      <main className="card animate-fade-in dashboard-main-content" style={{ flex: 1, minWidth: 0, minHeight: 'calc(100vh - 4rem)', padding: '2.5rem' }}>
        
        {/* Mobile Sidebar Toggle */}
        <div className="mobile-only" style={{ marginBottom: '1.5rem' }}>
          <button 
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="btn"
            style={{ background: 'var(--surface)', color: 'var(--primary)', border: '1px solid var(--primary)', justifyContent: 'flex-start' }}
          >
            <Menu size={20} /> {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} Menu
          </button>
        </div>
        
        {activeTab === 'overview' && (
          <div className="animate-fade-in">
            <h2 className="mb-6" style={{ fontSize: '1.5rem', fontWeight: '700' }}>Platform Insights</h2>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.5rem', marginBottom: '2.5rem' }}>
               <div className="card" style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1.25rem', borderLeft: '4px solid var(--primary)' }}>
                  <div style={{ background: 'rgba(79, 70, 229, 0.1)', padding: '0.75rem', borderRadius: '12px' }}>
                    <Users color="var(--primary)" size={24} />
                  </div>
                  <div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: '600', textTransform: 'uppercase' }}>Total Students</div>
                    <div style={{ fontSize: '1.75rem', fontWeight: '800' }}>{students.length || attempts.length}</div>
                  </div>
               </div>

               <div className="card" style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1.25rem', borderLeft: '4px solid var(--accent)' }}>
                  <div style={{ background: 'rgba(244, 129, 32, 0.1)', padding: '0.75rem', borderRadius: '12px' }}>
                    <Activity color="var(--accent)" size={24} />
                  </div>
                  <div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: '600', textTransform: 'uppercase' }}>Active Exams</div>
                    <div style={{ fontSize: '1.75rem', fontWeight: '800' }}>{exams.filter(e => new Date(e.scheduledFor) > new Date()).length}</div>
                  </div>
               </div>

               <div className="card" style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1.25rem', borderLeft: '4px solid #ef4444' }}>
                  <div style={{ background: 'rgba(239, 68, 68, 0.1)', padding: '0.75rem', borderRadius: '12px' }}>
                    <AlertCircle color="#ef4444" size={24} />
                  </div>
                  <div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: '600', textTransform: 'uppercase' }}>Violations Recorded</div>
                    <div style={{ fontSize: '1.75rem', fontWeight: '800' }}>{logs.length}</div>
                  </div>
               </div>

               <div className="card" style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1.25rem', borderLeft: '4px solid #10b981' }}>
                  <div style={{ background: 'rgba(16, 185, 129, 0.1)', padding: '0.75rem', borderRadius: '12px' }}>
                    <Award color="#10b981" size={24} />
                  </div>
                  <div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: '600', textTransform: 'uppercase' }}>Submissions</div>
                    <div style={{ fontSize: '1.75rem', fontWeight: '800' }}>{attempts.filter(a => a.status === 'finished').length}</div>
                  </div>
               </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
               <div className="card" style={{ padding: '1.5rem' }}>
                  <h3 style={{ fontSize: '1rem', fontWeight: '700', marginBottom: '1rem' }}>RECENT EXAM ACTIVITY</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {exams.slice(0, 5).map(e => (
                      <div key={e._id} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem', background: 'var(--background)', borderRadius: '8px' }}>
                        <span style={{ fontWeight: '600' }}>{e.title}</span>
                        <span className="badge badge-active">{new Date(e.scheduledFor).toLocaleDateString()}</span>
                      </div>
                    ))}
                  </div>
               </div>
               <div className="card" style={{ padding: '1.5rem' }}>
                  <h3 style={{ fontSize: '1rem', fontWeight: '700', marginBottom: '1rem' }}>SYSTEM SECURITY STATUS</h3>
                  <div style={{ textAlign: 'center', padding: '2rem' }}>
                     <Shield size={48} color="#10b981" style={{ marginBottom: '1rem' }} />
                     <div style={{ fontSize: '1.1rem', fontWeight: '700', color: '#10b981' }}>AI Proctoring Active</div>
                     <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>All real-time violation monitoring services are operational.</p>
                  </div>
               </div>
            </div>
          </div>
        )}

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
                        {mod.usn && <div style={{ fontSize: '0.8rem', color: 'var(--primary)', fontWeight: '600', marginBottom: '0.2rem' }}>USN: {mod.usn}</div>}
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
               <div className="badge badge-active">{standardStudents.length} Total</div>
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
                  {standardStudents.map(student => (
                    <tr key={student._id} style={{ borderBottom: '1px solid var(--border)' }}>
                      <td className="p-3">
                        <div className="font-medium" style={{ fontSize: '1.05rem' }}>{student.name}</div>
                        {student.usn && <div style={{ fontSize: '0.8rem', color: 'var(--primary)', fontWeight: '600', marginBottom: '0.2rem' }}>USN: {student.usn}</div>}
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
                  {standardStudents.length === 0 && <tr><td colSpan="3" className="p-8 text-center text-sm" style={{color: 'var(--text-secondary)'}}>No students found.</td></tr>}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'studentLookup' && user?.role === 'admin' && (
          <div style={{ maxWidth: '800px' }}>
            <div className="flex items-center gap-3 mb-6">
              <div style={{ background: 'rgba(79, 70, 229, 0.1)', padding: '0.5rem', borderRadius: '8px' }}>
                <Search size={24} color="var(--primary)" />
              </div>
              <h2 style={{ fontSize: '1.5rem', fontWeight: '600' }}>Master Lookup & Edit</h2>
            </div>

            <form onSubmit={handleStudentSearch} className="animate-fade-in mb-8" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
              <div>
                <label className="form-label" style={{ fontSize: '0.95rem' }}>Lookup Student UID</label>
                <input 
                  type="text" 
                  className="input uid-code-input" 
                  style={{ textAlign: 'center', padding: '1rem', fontSize: '1.2rem' }}
                  value={searchUid}
                  onChange={e => setSearchUid(e.target.value)}
                  placeholder="UID (e.g. X9YZ01) or Email"
                  required
                />
              </div>
              <button type="submit" className="btn btn-primary w-full justify-center" style={{ padding: '1rem', fontSize: '1.1rem' }}>Execute Search Protocol</button>
            </form>

            {searchedStudent && (
              <form onSubmit={handleUpdateStudent} className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
                <div style={{ background: 'rgba(0,0,0,0.02)', padding: '2rem', borderRadius: '16px', border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
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
                       <label className="form-label" style={{ fontSize: '0.95rem' }}>{editFormData.stream === 'Engineering' ? 'Branch' : 'Programme'}</label>
                       <select className="input" style={{ padding: '1rem', fontSize: '1.05rem' }} value={editFormData.branch} onChange={e => setEditFormData({...editFormData, branch: e.target.value})}>
                          <option value="">Select...</option>
                          {editFormData.stream === 'Engineering' ? (
                            ENGINEERING_BRANCHES.map(b => <option key={b} value={b}>{b}</option>)
                          ) : (
                            PG_PROGRAMS.map(p => <option key={p} value={p}>{p}</option>)
                          )}
                       </select>
                    </div>
                    <div className="form-group m-0">
                       <label className="form-label" style={{ fontSize: '0.95rem' }}>Specialization/Sub-branch</label>
                       <input type="text" className="input" style={{ padding: '1rem', fontSize: '1.05rem' }} value={editFormData.specialization} onChange={e => setEditFormData({...editFormData, specialization: e.target.value})} placeholder="e.g. Data Science" />
                    </div>
                  </div>
                </div>

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

                <button type="submit" className="btn btn-primary" style={{ alignSelf: 'flex-start', padding: '1rem 3rem', fontSize: '1.1rem', marginTop: '0.5rem', width: '100%' }}>
                  Update Student Details
                </button>
              </form>
            )}
          </div>
        )}
        {activeTab === 'broadcast' && user?.role === 'admin' && (
          <div className="animate-fade-in" style={{ maxWidth: '1000px' }}>
            <div className="flex items-center gap-3 mb-6">
              <div style={{ background: 'rgba(244, 129, 32, 0.1)', padding: '0.5rem', borderRadius: '8px' }}>
                <Bell size={24} color="var(--accent)" />
              </div>
              <div>
                <h2 style={{ fontSize: '1.5rem', fontWeight: '700', margin: 0 }}>Broadcast Announcements</h2>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: '0.25rem 0 0' }}>Send targeted announcements to specific student cohorts</p>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '2.5rem', alignItems: 'start' }}>
              {/* Compose Section */}
              <div className="card" style={{ padding: '2rem' }}>
                <h3 style={{ fontSize: '1rem', marginBottom: '1.5rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--text-secondary)' }}>Compose New Announcement</h3>
                <form onSubmit={handlePostAnnouncement} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                   <div className="form-group">
                     <label className="form-label">Announcement Title</label>
                     <input type="text" className="input" placeholder="e.g., MCA Semester End Exams — Schedule Released" value={annTitle} onChange={e => setAnnTitle(e.target.value)} required />
                   </div>

                   <div className="form-group">
                     <label className="form-label">Target Stream</label>
                     <select className="input" value={annStream} onChange={e => { setAnnStream(e.target.value); setAnnBranch('All'); }}>
                        <option value="All">All Streams</option>
                        <option value="Engineering">Engineering (B.E.)</option>
                        <option value="Post Graduation">Post Graduation</option>
                     </select>
                   </div>

                   {annStream !== 'All' && (
                     <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                       <div className="form-group" style={{ margin: 0 }}>
                         <label className="form-label">{annStream === 'Engineering' ? 'Target Branch' : 'Target Programme'}</label>
                         <select className="input" value={annBranch} onChange={e => setAnnBranch(e.target.value)}>
                           <option value="All">All {annStream === 'Engineering' ? 'Branches' : 'Programmes'}</option>
                           {annStream === 'Engineering' ? (
                             <>
                               <option>Aeronautical Engineering</option>
                               <option>Computer Science &amp; Engineering</option>
                               <option>Artificial Intelligence &amp; Machine Learning</option>
                               <option>CSE (IoT &amp; Cyber Security with Blockchain Technology)</option>
                               <option>CSE (Artificial Intelligence &amp; Machine Learning)</option>
                               <option>Information Science &amp; Engineering</option>
                               <option>Electronics &amp; Communication Engineering</option>
                               <option>Mechanical Engineering</option>
                               <option>Mechatronics</option>
                               <option>Robotics and Artificial Intelligence</option>
                               <option>Civil Engineering</option>
                             </>
                           ) : (
                             <>
                               <option>Master of Computer Applications (MCA)</option>
                               <option>Master of Business Administration (MBA)</option>
                               <option>Master of Technology (M.Tech) in Computer Science &amp; Engg.</option>
                             </>
                           )}
                         </select>
                       </div>
                       <div className="form-group" style={{ margin: 0 }}>
                         <label className="form-label">Target Year</label>
                         <select className="input" value={annYear} onChange={e => setAnnYear(parseInt(e.target.value))}>
                           <option value={0}>All Years</option>
                           <option value={1}>1st Year</option>
                           <option value={2}>2nd Year</option>
                           {annStream === 'Engineering' && <option value={3}>3rd Year</option>}
                           {annStream === 'Engineering' && <option value={4}>4th Year</option>}
                         </select>
                       </div>
                     </div>
                   )}

                   <div className="form-group">
                     <label className="form-label">Message Content</label>
                     <textarea className="input" style={{ minHeight: '150px', resize: 'vertical' }} placeholder="Type your announcement message here..." value={annContent} onChange={e => setAnnContent(e.target.value)} required></textarea>
                   </div>
                   <button type="submit" className="btn btn-primary w-full" style={{ padding: '0.85rem', fontSize: '1rem', fontWeight: '700', letterSpacing: '0.5px' }}>
                     📢 Broadcast to Students
                   </button>
                </form>
              </div>

              {/* Recent Broadcasts */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: '700', color: 'var(--text-secondary)' }}>RECENT BROADCASTS</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {recentAnnouncements.length === 0 ? (
                    <div className="card" style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '3rem' }}>
                      No recent announcements found.
                    </div>
                  ) : (
                    recentAnnouncements.map(ann => (
                      <div key={ann._id} className="card animate-slide-up" style={{ padding: '1.25rem', borderLeft: '4px solid var(--accent)' }}>
                        <div className="flex justify-between items-start mb-2">
                           <h4 style={{ fontSize: '1rem', fontWeight: '700' }}>{ann.title}</h4>
                           <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>{new Date(ann.createdAt).toLocaleDateString()}</span>
                        </div>
                        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: '1.6', marginBottom: '1rem' }}>{ann.content}</p>
                        <div className="flex gap-2">
                           <span className="badge" style={{ background: 'var(--background)', fontSize: '0.65rem' }}>Target: {ann.targetBranch} {ann.targetStream}</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'roles' && user?.role === 'admin' && (
          <div style={{ maxWidth: '600px' }}>
            <div className="flex items-center gap-3 mb-2">
              <div style={{ background: 'rgba(79, 70, 229, 0.1)', padding: '0.5rem', borderRadius: '8px' }}>
                <Shield size={24} color="var(--primary)" />
              </div>
              <h2 style={{ fontSize: '1.5rem', fontWeight: '600' }}>Access Control</h2>
            </div>
            
            <p className="mb-6" style={{ color: 'var(--text-secondary)', lineHeight: 1.6 }}>
              You can effortlessly elevate standard students into Moderators, granting them dashboard access. Just grab their unique 6-character UID from the list.
            </p>

            <form onSubmit={handleGrantRole} className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
              <div>
                <label className="form-label" style={{ fontSize: '0.95rem' }}>Target User UID</label>
                <input 
                  type="text" 
                  className="input uid-code-input" 
                  style={{ textAlign: 'center', padding: '1rem', fontSize: '1.2rem' }}
                  value={targetUid} 
                  onChange={e => setTargetUid(e.target.value)} 
                  required 
                  placeholder="UID or Email" 
                />
              </div>
              <div>
                <label className="form-label" style={{ fontSize: '0.95rem' }}>Assign Privileges</label>
                <select className="input" style={{ padding: '1rem', fontSize: '1rem' }} value={targetRole} onChange={e => setTargetRole(e.target.value)}>
                  <option value="moderator">Moderator (Can view metrics)</option>
                  <option value="student">Student (Demote to standard access)</option>
                </select>
              </div>
              <button type="submit" className="btn btn-primary w-full justify-center" style={{ padding: '1.25rem', fontSize: '1.1rem', marginTop: '1rem' }}>Deploy Protocol</button>
            </form>
          </div>
        )}

        {activeTab === 'manageExams' && user?.role === 'admin' && (
          <div>
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-4">
                  <h2 style={{ fontSize: '1.5rem', fontWeight: '600' }}>Exam Operations</h2>
                  <div style={{ position: 'relative' }}>
                    <Search size={16} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
                    <input 
                      type="text" 
                      placeholder="Search Exam ID or Title..." 
                      value={examSearch}
                      onChange={(e) => setExamSearch(e.target.value)}
                      className="input"
                      style={{ padding: '0.5rem 1rem 0.5rem 2.5rem', width: '240px', fontSize: '0.85rem' }}
                    />
                  </div>
                </div>
                <button className="btn btn-primary" onClick={() => setActiveTab('createExam')}>
                  <PlusCircle size={16} /> New Exam
                </button>
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
          <div style={{ maxWidth: '800px' }}>
            <h2 className="mb-6" style={{ fontSize: '1.5rem', fontWeight: '600' }}>Architect New Exam</h2>
            
            <form onSubmit={handleCreateExam}>
              <div className="mb-6" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div className="flex gap-4">
                  <div className="form-group flex-1 m-0">
                    <label className="form-label">Exam Title</label>
                    <input type="text" className="input" style={{ fontSize: '1.1rem', padding: '0.8rem 1rem' }} value={examTitle} onChange={e => setExamTitle(e.target.value)} required placeholder="e.g. CS101 Midterm" />
                  </div>
                  <div className="form-group m-0" style={{ width: '150px' }}>
                    <label className="form-label">Duration (m)</label>
                    <input type="number" min="1" className="input" style={{ fontSize: '1.1rem', padding: '0.8rem 1rem' }} value={examDuration} onChange={e => setExamDuration(e.target.value)} required />
                  </div>
                </div>
                
                <div className="flex gap-4 mt-4">
                  <div className="form-group flex-1 m-0">
                    <label className="form-label">Scheduled Date & Time</label>
                    <input type="datetime-local" className="input" style={{ fontSize: '1.1rem', padding: '0.8rem 1rem' }} value={scheduledFor} onChange={e => setScheduledFor(e.target.value)} required />
                  </div>
                  <div className="form-group flex-1 m-0">
                    <label className="form-label">Target Stream</label>
                    <select className="input" style={{ fontSize: '1.1rem', padding: '0.8rem 1rem' }} value={examStream} onChange={e => { setExamStream(e.target.value); setExamTargetBranch('All'); setExamTargetYear(0); }}>
                      <option value="All">All Students (Universal)</option>
                      <option value="Engineering">Engineering (B.E.)</option>
                      <option value="Post Graduation">Post Graduation</option>
                    </select>
                  </div>
                </div>

                {/* Branch + Year targeting — only shown when stream ≠ All */}
                {examStream !== 'All' && (
                  <div className="flex gap-4 mt-4">
                    <div className="form-group flex-1 m-0">
                      <label className="form-label">
                        {examStream === 'Engineering' ? 'Target Branch' : 'Target PG Programme'}
                      </label>
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
                    <div className="form-group m-0" style={{ width: '180px' }}>
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
              </div>

              <div>
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

                <button type="button" className="btn" style={{ border: '1px dashed var(--primary)', color: 'var(--primary)', width: '100%', padding: '1rem', background: 'rgba(79, 70, 229, 0.05)', marginBottom: '8rem' }} onClick={addQuestion}>
                  <PlusCircle size={18} /> Append Another Question
                </button>
              </div>

              <div className="flex items-center justify-between" style={{ display: 'flex', alignItems: 'center', position: 'sticky', bottom: '0', padding: '1.5rem 0', borderTop: '2px solid var(--border)', zIndex: 10, marginTop: '2rem', background: 'var(--surface)' }}>
                 <div>
                   <p style={{ fontWeight: 'bold', fontSize: '1.1rem' }}>Ready to deploy?</p>
                   <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Instantly pushes to all Student client apps.</p>
                   <p style={{ fontSize: '0.85rem', color: 'var(--danger)', fontWeight: 'bold', marginTop: '0.4rem', borderLeft: '3px solid var(--danger)', paddingLeft: '0.5rem' }}>
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
