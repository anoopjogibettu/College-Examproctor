import React, { useEffect, useState, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import {
  BookOpen, Camera, LogOut, Clock, Award, LayoutDashboard, FileText,
  User, Bell, Search, ChevronRight, CheckCircle2, Printer, ShieldCheck,
  Mail, Activity
} from 'lucide-react';

const Dashboard = () => {
  const { user, logout } = useContext(AuthContext);
  const [exams, setExams] = useState([]);
  const [myResults, setMyResults] = useState(null);
  const [usn, setUsn] = useState('');
  const [faceRegistered, setFaceRegistered] = useState(user?.hasFaceRegistered || false);
  const [expandedId, setExpandedId] = useState(null);
  const [studentInfo, setStudentInfo] = useState({ usn: '', name: '' });
  const [announcements, setAnnouncements] = useState([]);
  const [activeTab, setActiveTab] = useState('dashboard'); // 'dashboard' | 'profile'
  const [bellOpen, setBellOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
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
        setStudentInfo({
          usn: data.usn || user.usn || 'NOT ISSUED',
          name: data.name || user.name
        });
      } catch (error) {
        console.error('Failed to fetch results');
      }
    };
    const fetchAnnouncements = async () => {
      try {
        const { data } = await axios.get(`${import.meta.env.VITE_API_URL}/api/announcements/my`, {
          headers: { Authorization: `Bearer ${user.token}` }
        });
        setAnnouncements(data);
      } catch (error) {
        console.error('Failed to fetch announcements');
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
    fetchAnnouncements();
    verifyBiometrics();
  }, [user]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const filteredExams = exams.filter(e => {
    if (e.hasAttempted) return false;
    if (searchQuery.trim() !== '') {
      return e.title?.toLowerCase().includes(searchQuery.toLowerCase());
    }
    return true;
  });

  const activeExams = filteredExams;
  const upcomingExam = activeExams.length > 0 ? activeExams[0] : null;
  const otherExams = activeExams.slice(1);
  const publishedResults = myResults?.attempts?.filter(r => {
    if (!r.examId?.resultsPublished) return false;
    if (searchQuery.trim() !== '') {
      return r.examId?.title?.toLowerCase().includes(searchQuery.toLowerCase());
    }
    return true;
  }) || [];

  // ── Sidebar nav item ──
  const NavItem = ({ id, icon: Icon, label }) => (
    <div
      onClick={() => setActiveTab(id)}
      style={{
        display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem',
        borderRadius: '12px', cursor: 'pointer', transition: 'background 0.2s',
        fontWeight: activeTab === id ? '700' : '600',
        background: activeTab === id ? 'rgba(9, 82, 155, 0.1)' : 'transparent',
        color: activeTab === id ? 'var(--primary)' : 'var(--text-secondary)',
      }}
      onMouseEnter={e => { if (activeTab !== id) e.currentTarget.style.background = 'var(--surface-hover)'; }}
      onMouseLeave={e => { if (activeTab !== id) e.currentTarget.style.background = 'transparent'; }}
    >
      <Icon size={20} />
      <span>{label}</span>
    </div>
  );

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: 'var(--background)' }}>

      {/* ── SIDEBAR ── */}
      <aside style={{
        width: '260px', backgroundColor: 'var(--surface)', padding: '2rem 1.5rem',
        display: 'flex', flexDirection: 'column', gap: '2rem',
        borderRight: '1px solid var(--border)', flexShrink: 0
      }}>
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', paddingLeft: '1rem' }}>
          <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ color: 'white', fontWeight: 'bold', fontSize: '1.2rem' }}>P</span>
          </div>
          <span style={{ fontSize: '1.25rem', fontWeight: '800', letterSpacing: '-0.5px' }}>ProctorAI</span>
        </div>

        {/* Nav */}
        <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', flex: 1 }}>
          <NavItem id="dashboard" icon={LayoutDashboard} label="Dashboard" />
          <NavItem id="profile"   icon={User}            label="Profile" />
          <NavItem id="faceSetup" icon={Camera}          label="Face Setup" />
        </nav>

        {/* Logout */}
        <div
          style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem', borderRadius: '12px', color: 'var(--text-secondary)', fontWeight: '600', cursor: 'pointer', transition: 'background 0.2s' }}
          onClick={handleLogout}
          onMouseEnter={e => e.currentTarget.style.background = 'var(--surface-hover)'}
          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
        >
          <LogOut size={20} />
          <span>Disconnect</span>
        </div>
      </aside>

      {/* ── MAIN ── */}
      <main style={{ flex: 1, padding: '2rem 3rem', display: 'flex', flexDirection: 'column', gap: '2rem', overflowY: 'auto' }}>

        {/* TOP BAR */}
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ position: 'relative', width: '300px' }}>
            {activeTab === 'dashboard' && (
              <>
                <Search size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
                <input 
                  type="text" 
                  placeholder="Search assessments..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="input" 
                  style={{ paddingLeft: '2.5rem', borderRadius: '999px', background: 'var(--surface)', border: 'none', boxShadow: 'var(--shadow-sm)' }} 
                />
              </>
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
            {/* UID / Stream badges */}
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <div className="badge" style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text-secondary)' }}>UID: {user?.uid || 'LEGACY'}</div>
              <div className="badge" style={{ background: 'rgba(9,82,155,0.1)', color: 'var(--primary)' }}>{user?.stream || 'No Stream'}</div>
            </div>

            {/* Bell with dropdown */}
            <div style={{ position: 'relative' }}>
              {/* Bell button */}
              <button
                onClick={() => setBellOpen(o => !o)}
                title="Announcements"
                style={{
                  position: 'relative', background: bellOpen ? 'rgba(9,82,155,0.1)' : 'var(--surface)',
                  border: '1px solid var(--border)', borderRadius: '50%',
                  width: '40px', height: '40px', display: 'flex', alignItems: 'center',
                  justifyContent: 'center', cursor: 'pointer', transition: 'background 0.2s'
                }}
              >
                <Bell size={18} color={bellOpen ? 'var(--primary)' : 'var(--text-secondary)'} />
                {/* Unread count badge */}
                {announcements.filter(a => !a.isRead).length > 0 && (
                  <span style={{
                    position: 'absolute', top: '-4px', right: '-4px',
                    background: 'var(--accent)', color: 'white',
                    fontSize: '0.6rem', fontWeight: '800',
                    width: '16px', height: '16px', borderRadius: '50%',
                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                  }}>
                    {announcements.filter(a => !a.isRead).length > 9 ? '9+' : announcements.filter(a => !a.isRead).length}
                  </span>
                )}
              </button>

              {/* Dropdown panel */}
              {bellOpen && (
                <>
                  {/* Backdrop */}
                  <div onClick={() => setBellOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 998 }} />
                  <div style={{
                    position: 'absolute', top: 'calc(100% + 10px)', right: 0,
                    width: '360px', background: 'var(--surface)',
                    border: '1px solid var(--border)', borderRadius: '16px',
                    boxShadow: '0 12px 40px rgba(0,0,0,0.15)',
                    zIndex: 999, overflow: 'hidden'
                  }}>
                    {/* Dropdown header */}
                    <div style={{ padding: '0.9rem 1.25rem', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                        <span style={{ fontWeight: '700', fontSize: '0.95rem' }}>Announcements</span>
                        {announcements.filter(a => !a.isRead).length > 0 && (
                          <span style={{ fontSize: '0.68rem', background: 'rgba(244,129,32,0.12)', color: 'var(--accent)', padding: '0.2rem 0.55rem', borderRadius: '999px', fontWeight: '800' }}>
                            {announcements.filter(a => !a.isRead).length} unread
                          </span>
                        )}
                      </div>
                      {/* Mark all as read */}
                      {announcements.some(a => !a.isRead) && (
                        <button
                          onClick={async () => {
                            const unread = announcements.filter(a => !a.isRead);
                            await Promise.all(unread.map(a =>
                              axios.patch(`${import.meta.env.VITE_API_URL}/api/announcements/${a._id}/read`, {}, {
                                headers: { Authorization: `Bearer ${user.token}` }
                              }).catch(() => {})
                            ));
                            setAnnouncements(prev => prev.map(a => ({ ...a, isRead: true })));
                          }}
                          style={{ fontSize: '0.72rem', color: 'var(--primary)', background: 'none', border: 'none', cursor: 'pointer', fontWeight: '700', padding: '0.2rem 0.4rem', borderRadius: '4px' }}
                          onMouseEnter={e => e.currentTarget.style.textDecoration = 'underline'}
                          onMouseLeave={e => e.currentTarget.style.textDecoration = 'none'}
                        >
                          Mark all as read
                        </button>
                      )}
                    </div>

                    {/* Announcement list */}
                    <div style={{ maxHeight: '380px', overflowY: 'auto' }}>
                      {announcements.length === 0 ? (
                        <div style={{ padding: '2.5rem', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                          <Bell size={28} style={{ margin: '0 auto 0.75rem', opacity: 0.3, display: 'block' }} />
                          No announcements yet.
                        </div>
                      ) : announcements.map((ann, i) => (
                        <div
                          key={ann._id}
                          style={{
                            padding: '1rem 1.25rem',
                            borderBottom: i < announcements.length - 1 ? '1px solid var(--border)' : 'none',
                            transition: 'background 0.15s',
                            background: ann.isRead ? 'transparent' : 'rgba(9,82,155,0.03)',
                            borderLeft: ann.isRead ? '3px solid transparent' : '3px solid var(--primary)',
                          }}
                          onMouseEnter={e => e.currentTarget.style.background = 'var(--background)'}
                          onMouseLeave={e => e.currentTarget.style.background = ann.isRead ? 'transparent' : 'rgba(9,82,155,0.03)'}
                        >
                          {/* Row: label + date + unread dot */}
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.3rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                              {!ann.isRead && (
                                <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: 'var(--primary)', display: 'inline-block', flexShrink: 0 }} />
                              )}
                              <span style={{ fontSize: '0.68rem', color: ann.isRead ? 'var(--text-secondary)' : 'var(--primary)', fontWeight: '700', textTransform: 'uppercase' }}>Official</span>
                            </div>
                            <span style={{ fontSize: '0.68rem', color: 'var(--text-secondary)' }}>{new Date(ann.createdAt).toLocaleDateString()}</span>
                          </div>

                          {/* Title */}
                          <p style={{ margin: '0 0 0.3rem 0', fontWeight: ann.isRead ? '600' : '700', fontSize: '0.88rem', color: ann.isRead ? 'var(--text-secondary)' : 'var(--text-primary)' }}>
                            {ann.title}
                          </p>

                          {/* Content */}
                          <p style={{ margin: '0 0 0.6rem 0', fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: '1.45' }}>
                            {ann.content}
                          </p>

                          {/* Mark as read button — only shown if unread */}
                          {!ann.isRead && (
                            <button
                              onClick={async (e) => {
                                e.stopPropagation();
                                try {
                                  await axios.patch(`${import.meta.env.VITE_API_URL}/api/announcements/${ann._id}/read`, {}, {
                                    headers: { Authorization: `Bearer ${user.token}` }
                                  });
                                  setAnnouncements(prev => prev.map(a => a._id === ann._id ? { ...a, isRead: true } : a));
                                } catch {}
                              }}
                              style={{
                                fontSize: '0.72rem', color: 'var(--primary)', background: 'rgba(9,82,155,0.08)',
                                border: '1px solid rgba(9,82,155,0.15)', borderRadius: '6px',
                                padding: '0.25rem 0.65rem', cursor: 'pointer', fontWeight: '700',
                                transition: 'background 0.2s'
                              }}
                              onMouseEnter={e => e.currentTarget.style.background = 'rgba(9,82,155,0.15)'}
                              onMouseLeave={e => e.currentTarget.style.background = 'rgba(9,82,155,0.08)'}
                            >
                              ✓ Mark as read
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Name + Avatar */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div style={{ textAlign: 'right' }}>
                <p style={{ fontWeight: '600', fontSize: '0.9rem', color: 'var(--text-primary)', margin: 0 }}>{user?.name}</p>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', margin: 0 }}>{usn || user?.usn || 'Student'}</p>
              </div>
              {/* Avatar → profile tab */}
              <div
                onClick={() => setActiveTab('profile')}
                title="View Profile"
                style={{
                  width: '42px', height: '42px', borderRadius: '50%',
                  background: 'var(--primary)', color: 'white',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontWeight: 'bold', fontSize: '1.1rem', cursor: 'pointer',
                  boxShadow: activeTab === 'profile' ? '0 0 0 3px var(--accent)' : '0 0 0 2px transparent',
                  transition: 'box-shadow 0.2s'
                }}
                onMouseEnter={e => e.currentTarget.style.boxShadow = '0 0 0 3px var(--accent)'}
                onMouseLeave={e => e.currentTarget.style.boxShadow = activeTab === 'profile' ? '0 0 0 3px var(--accent)' : '0 0 0 2px transparent'}
              >
                {user?.name?.charAt(0) || 'U'}
              </div>
            </div>
          </div>
        </header>

        {/* ══════════════════════════════════════
            TAB: DASHBOARD
        ══════════════════════════════════════ */}
        {activeTab === 'dashboard' && (
          <>
            {/* Biometrics alert */}
            {!faceRegistered && (
              <div className="card animate-fade-in" style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(244, 129, 32, 0.1)', borderColor: 'var(--accent)', borderRadius: '16px' }}>
                <div className="flex items-center gap-4">
                  <div style={{ padding: '0.75rem', borderRadius: '50%', background: 'var(--accent)', color: 'white' }}>
                    <Camera size={24} />
                  </div>
                  <div>
                    <h3 style={{ fontSize: '1.1rem', color: 'var(--text-primary)', marginBottom: '0.2rem' }}>Action Required: Register Biometrics</h3>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>You must map your facial geometry to enable AI proctoring before accessing assessments.</p>
                  </div>
                </div>
                <button className="btn btn-primary" onClick={() => setActiveTab('faceSetup')}>Start Setup</button>
              </div>
            )}

            {/* Exams row */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '2rem' }}>
              {/* Upcoming test */}
              {upcomingExam ? (
                <div className="card glass animate-fade-in" style={{ padding: '2.5rem', borderRadius: '24px', position: 'relative', overflow: 'hidden', display: 'flex', flexDirection: 'column', minHeight: '300px' }}>
                  <div style={{ position: 'absolute', top: '-20%', right: '-10%', width: '300px', height: '300px', background: 'radial-gradient(circle, rgba(9,82,155,0.1) 0%, transparent 70%)', pointerEvents: 'none' }} />
                  <h2 style={{ fontSize: '1.25rem', marginBottom: '2rem', color: 'var(--text-secondary)' }}>Upcoming Test</h2>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 1, paddingBottom: '2rem' }}>
                    <div style={{ width: '100px', height: '100px', background: 'rgba(244,129,32,0.1)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <BookOpen size={50} color="var(--accent)" />
                    </div>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <h3 style={{ fontSize: '1.6rem', fontWeight: '800', marginBottom: '0.5rem' }}>
                      {upcomingExam.title} <span style={{ fontSize: '1rem', color: 'var(--text-secondary)', fontWeight: '600' }}>({upcomingExam.questions?.length || 0} marks)</span>
                    </h3>
                    <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                      <Clock size={16} color="var(--primary)" /> {upcomingExam.duration} mins
                      <span style={{ color: 'var(--accent)', fontWeight: '600', marginLeft: '1rem' }}>
                        Deadline: {new Date(upcomingExam.scheduledFor).toLocaleDateString()}
                      </span>
                    </p>
                    <button
                      className="btn"
                      style={{ padding: '0.8rem 2rem', borderRadius: '999px', fontSize: '1rem', background: (!faceRegistered || new Date() < new Date(upcomingExam.scheduledFor)) ? 'var(--surface-hover)' : 'var(--accent)', color: (!faceRegistered || new Date() < new Date(upcomingExam.scheduledFor)) ? 'var(--text-secondary)' : 'white' }}
                      disabled={!faceRegistered || new Date() < new Date(upcomingExam.scheduledFor)}
                      onClick={() => navigate(`/exam/${upcomingExam._id}`)}
                    >
                      Take The Test
                    </button>
                  </div>
                </div>
              ) : (
                <div className="card glass animate-fade-in" style={{ padding: '4rem', borderRadius: '24px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '300px' }}>
                  <BookOpen size={48} color="var(--border)" style={{ marginBottom: '1rem' }} />
                  <h2 style={{ fontSize: '1.5rem', color: 'var(--text-secondary)' }}>No Upcoming Tests</h2>
                  <p style={{ color: 'var(--text-secondary)', opacity: 0.7 }}>You're all caught up!</p>
                </div>
              )}

              {/* Tasks */}
              <div className="card animate-fade-in" style={{ borderRadius: '24px', padding: '2rem' }}>
                <h2 style={{ fontSize: '1.25rem', marginBottom: '1.5rem' }}>Tasks</h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                  {otherExams.length > 0 ? otherExams.map(exam => {
                    const isFuture = new Date() < new Date(exam.scheduledFor);
                    return (
                      <div key={exam._id} style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
                        <div style={{ marginTop: '0.2rem' }}>
                          <div style={{ width: '16px', height: '16px', borderRadius: '50%', border: `2px solid ${isFuture ? 'var(--border)' : 'var(--accent)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            {!isFuture && <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--accent)' }} />}
                          </div>
                        </div>
                        <div style={{ flex: 1 }}>
                          <h4 style={{ fontWeight: '600', fontSize: '0.95rem', marginBottom: '0.2rem' }}>{exam.title}</h4>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem' }}>
                            <span style={{ color: 'var(--text-secondary)' }}>Pending</span>
                            <span style={{ color: isFuture ? 'var(--text-secondary)' : 'var(--danger)', fontWeight: isFuture ? 'normal' : '600' }}>
                              {isFuture ? new Date(exam.scheduledFor).toLocaleDateString() : 'Urgent'}
                            </span>
                          </div>
                          {!isFuture && faceRegistered && (
                            <button className="btn btn-primary" style={{ marginTop: '0.75rem', padding: '0.4rem 1rem', fontSize: '0.75rem', borderRadius: '6px' }} onClick={() => navigate(`/exam/${exam._id}`)}>
                              Start Now
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  }) : (
                    <div style={{ textAlign: 'center', padding: '2rem 0', color: 'var(--text-secondary)' }}>
                      <CheckCircle2 size={32} style={{ margin: '0 auto 1rem', opacity: 0.5 }} />
                      <p>No other pending tasks.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* ── ACADEMIC TRANSCRIPT ── */}
            <div style={{ marginTop: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <div>
                  <h2 style={{ fontSize: '1.5rem', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <Award size={26} color="var(--primary)" /> Academic Transcript
                  </h2>
                  <p style={{ color: 'var(--text-secondary)', marginTop: '0.3rem', fontSize: '0.9rem' }}>Official Institutional Grade Records & Results Repository</p>
                </div>
                <button className="btn" onClick={() => window.print()} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'var(--surface)', border: '1px solid var(--border)' }}>
                  <Printer size={16} /> Print Transcript
                </button>
              </div>

              {/* Student identity card */}
              <div className="card" style={{ padding: '1.5rem 2rem', marginBottom: '1.5rem', borderLeft: '6px solid var(--primary)', background: 'var(--surface)' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px,1fr))', gap: '2rem' }}>
                  <div>
                    <label style={{ fontSize: '0.72rem', fontWeight: '700', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Candidate Name</label>
                    <p style={{ fontSize: '1.15rem', fontWeight: '700', margin: '0.25rem 0 0 0' }}>{studentInfo.name}</p>
                  </div>
                  <div>
                    <label style={{ fontSize: '0.72rem', fontWeight: '700', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>University Seat Number (USN)</label>
                    <p style={{ fontSize: '1.15rem', fontWeight: '700', margin: '0.25rem 0 0 0', color: 'var(--primary)' }}>{studentInfo.usn}</p>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem', background: 'rgba(16,185,129,0.1)', color: '#059669', borderRadius: '8px', fontSize: '0.85rem', fontWeight: '700' }}>
                      <ShieldCheck size={16} /> Verified Record
                    </div>
                  </div>
                </div>
              </div>

              {/* Results table */}
              <div className="card animate-fade-in" style={{ padding: 0, overflow: 'hidden', borderRadius: '16px' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                  <thead style={{ background: 'var(--background)' }}>
                    <tr>
                      <th style={{ padding: '1.1rem 1.25rem', color: 'var(--text-secondary)', fontSize: '0.8rem', textTransform: 'uppercase' }}>Course / Exam Title</th>
                      <th style={{ padding: '1.1rem 1.25rem', color: 'var(--text-secondary)', fontSize: '0.8rem', textTransform: 'uppercase' }}>Submission Date</th>
                      <th style={{ padding: '1.1rem 1.25rem', color: 'var(--text-secondary)', fontSize: '0.8rem', textTransform: 'uppercase', textAlign: 'center' }}>Maximum</th>
                      <th style={{ padding: '1.1rem 1.25rem', color: 'var(--text-secondary)', fontSize: '0.8rem', textTransform: 'uppercase', textAlign: 'center' }}>Achieved</th>
                      <th style={{ padding: '1.1rem 1.25rem', color: 'var(--text-secondary)', fontSize: '0.8rem', textTransform: 'uppercase', textAlign: 'center' }}>Status</th>
                      <th style={{ padding: '1.1rem 1.25rem' }}></th>
                    </tr>
                  </thead>
                  <tbody>
                    {publishedResults.length === 0 ? (
                      <tr>
                        <td colSpan="6" style={{ padding: '3.5rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                          No verified exam results published for this candidate yet.
                        </td>
                      </tr>
                    ) : publishedResults.map(result => (
                      <React.Fragment key={result._id}>
                        <tr style={{ borderTop: '1px solid var(--border)', transition: 'background 0.2s' }} onMouseEnter={e => e.currentTarget.style.background = 'var(--background)'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                          <td style={{ padding: '1.1rem 1.25rem' }}>
                            <div style={{ fontWeight: '700', color: 'var(--text-primary)' }}>{result.examId?.title}</div>
                            <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', marginTop: '0.15rem' }}>Institutional Assessment</div>
                          </td>
                          <td style={{ padding: '1.1rem 1.25rem', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>{new Date(result.submittedAt).toLocaleDateString()}</td>
                          <td style={{ padding: '1.1rem 1.25rem', textAlign: 'center', fontWeight: '600' }}>{result.examId?.questions?.reduce((acc, q) => acc + (q.marks || 1), 0) || 0}</td>
                          <td style={{ padding: '1.1rem 1.25rem', textAlign: 'center', fontWeight: '800', color: 'var(--primary)', fontSize: '1.05rem' }}>{result.score || 0}</td>
                          <td style={{ padding: '1.1rem 1.25rem', textAlign: 'center' }}>
                            <span style={{ padding: '0.35rem 0.75rem', borderRadius: '6px', background: '#ecfdf5', color: '#059669', fontSize: '0.72rem', fontWeight: '800', textTransform: 'uppercase' }}>PUBLISHED</span>
                          </td>
                          <td style={{ padding: '1.1rem 1.25rem', textAlign: 'right' }}>
                            <button onClick={() => setExpandedId(expandedId === result._id ? null : result._id)} className="btn" style={{ padding: '0.35rem 0.9rem', fontSize: '0.78rem', border: '1px solid var(--border)', background: 'var(--surface-hover)' }}>
                              {expandedId === result._id ? 'Close' : 'View Breakdown'}
                            </button>
                          </td>
                        </tr>
                        {expandedId === result._id && (
                          <tr style={{ background: 'rgba(9,82,155,0.02)' }}>
                            <td colSpan="6" style={{ padding: '2rem' }}>
                              <div className="animate-fade-in">
                                <h4 style={{ margin: '0 0 1.25rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--primary)' }}>
                                  <FileText size={18} /> Detailed Assessment Breakdown
                                </h4>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                  {result.examId?.questions?.map((q, idx) => {
                                    const studentAnswer = result.answers?.[q._id];
                                    const isCorrect = q.type === 'mcq' && studentAnswer === q.correctAnswer;
                                    return (
                                      <div key={idx} style={{ padding: '1.25rem', background: 'var(--surface)', borderRadius: '12px', border: '1px solid var(--border)' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                                          <div style={{ fontWeight: '700', fontSize: '0.95rem' }}>Q{idx + 1}: {q.questionText}</div>
                                          <div style={{ fontWeight: '800', color: isCorrect ? '#10b981' : 'var(--primary)' }}>{isCorrect ? q.marks || 1 : 'Manual / Graded'} Marks</div>
                                        </div>
                                        <div style={{ padding: '1rem', background: 'var(--background)', borderRadius: '8px', fontSize: '0.9rem', color: 'var(--text-secondary)', borderLeft: '3px solid var(--border)' }}>
                                          <span style={{ fontSize: '0.7rem', textTransform: 'uppercase', display: 'block', marginBottom: '0.5rem' }}>Your Submission:</span>
                                          <div style={{ color: 'var(--text-primary)', whiteSpace: 'pre-wrap' }}>{studentAnswer || 'NO RESPONSE'}</div>
                                        </div>
                                        {q.type === 'mcq' && !isCorrect && (
                                          <div style={{ marginTop: '0.75rem', fontSize: '0.85rem', color: '#10b981', fontWeight: '600' }}>Correct Answer: {q.correctAnswer}</div>
                                        )}
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Footer */}
              <div style={{ marginTop: '2rem', padding: '1.5rem 2rem', borderTop: '1px dashed var(--border)', textAlign: 'center' }}>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', maxWidth: '600px', margin: '0 auto', lineHeight: '1.6' }}>
                  This transcript is electronically generated and verified by the Mangalore Institute of Technology & Engineering academic portal. Any alteration to this record is strictly prohibited.
                </p>
                <div style={{ marginTop: '1rem', fontWeight: '700', fontSize: '0.72rem', color: 'var(--text-secondary)', letterSpacing: '1px' }}>
                  GENERATED ON {new Date().toLocaleString().toUpperCase()}
                </div>
              </div>
            </div>
          </>
        )}

        {/* ══════════════════════════════════════
            TAB: PROFILE
        ══════════════════════════════════════ */}
        {activeTab === 'profile' && (
          <div className="animate-fade-in">

            {/* Hero banner */}
            <div className="card" style={{ marginBottom: '2rem', padding: '2.5rem', background: 'linear-gradient(135deg, var(--primary) 0%, #073d75 100%)', color: 'white', border: 'none', borderRadius: '20px', overflow: 'hidden', position: 'relative' }}>
              <div style={{ position: 'absolute', top: '-50px', right: '-50px', width: '200px', height: '200px', background: 'var(--accent)', opacity: 0.2, borderRadius: '50%', filter: 'blur(40px)' }} />
              {/* Sign out */}
              <button
                onClick={handleLogout}
                className="btn"
                style={{ position: 'absolute', top: '1.5rem', right: '1.5rem', background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.25)', color: 'white' }}
              >
                <LogOut size={15} style={{ marginRight: '0.4rem' }} /> Sign Out
              </button>

              <div style={{ display: 'flex', alignItems: 'center', gap: '2rem', position: 'relative', zIndex: 1 }}>
                <div style={{ width: '90px', height: '90px', background: 'linear-gradient(135deg, var(--accent) 0%, #fff 100%)', borderRadius: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '3rem', fontWeight: 'bold', color: 'var(--primary)', boxShadow: '0 8px 16px rgba(0,0,0,0.15)', transform: 'rotate(-5deg)', flexShrink: 0 }}>
                  <span style={{ transform: 'rotate(5deg)' }}>{user?.name?.charAt(0) || 'U'}</span>
                </div>
                <div>
                  <h1 style={{ margin: 0, fontSize: '2rem', fontWeight: '800' }}>{user?.name}</h1>
                  <p style={{ margin: '0.25rem 0 0 0', opacity: 0.9, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Mail size={15} /> {user?.email}
                  </p>
                  <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginTop: '1rem' }}>
                    <span className="badge" style={{ background: 'rgba(255,255,255,0.2)', color: 'white' }}>{user?.stream || 'Engineering'} • Year {user?.year || 1}</span>
                    <span className="badge" style={{ background: 'rgba(255,255,255,0.2)', color: 'white' }}>USN: {usn || user?.usn || 'PENDING'}</span>
                    <span className="badge" style={{ background: 'rgba(255,255,255,0.2)', color: 'white' }}>UID: {user?.uid}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Content grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: '2rem' }}>

              {/* Left: verification + stats */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>

                {/* Institutional Verification */}
                <div className="card" style={{ padding: '2rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem' }}>
                    <Award size={22} color="var(--primary)" />
                    <h3 style={{ fontSize: '1.15rem', fontWeight: '700', margin: 0 }}>Institutional Verification</h3>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
                    <div style={{ padding: '1.25rem', background: 'var(--background)', borderRadius: '12px', border: '1px solid var(--border)' }}>
                      <p style={{ margin: 0, fontSize: '0.72rem', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: '700', letterSpacing: '0.5px' }}>Academic Branch</p>
                      <p style={{ margin: '0.5rem 0 0 0', fontWeight: '600', fontSize: '1rem' }}>{user?.branch || 'General'}</p>
                    </div>
                    <div style={{ padding: '1.25rem', background: 'var(--background)', borderRadius: '12px', border: '1px solid var(--border)' }}>
                      <p style={{ margin: 0, fontSize: '0.72rem', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: '700', letterSpacing: '0.5px' }}>College Details</p>
                      <p style={{ margin: '0.5rem 0 0 0', fontWeight: '600', fontSize: '1rem' }}>{user?.collegeDetails || 'MITE Campus'}</p>
                    </div>
                    <div style={{ padding: '1.25rem', background: 'var(--background)', borderRadius: '12px', border: '1px solid var(--border)' }}>
                      <p style={{ margin: 0, fontSize: '0.72rem', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: '700', letterSpacing: '0.5px' }}>Specialization</p>
                      <p style={{ margin: '0.5rem 0 0 0', fontWeight: '600', fontSize: '1rem' }}>{user?.specialization || '—'}</p>
                    </div>
                    <div style={{ padding: '1.25rem', background: 'var(--background)', borderRadius: '12px', border: '1px solid var(--border)' }}>
                      <p style={{ margin: 0, fontSize: '0.72rem', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: '700', letterSpacing: '0.5px' }}>Biometrics</p>
                      <p style={{ margin: '0.5rem 0 0 0', fontWeight: '700', fontSize: '1rem', color: faceRegistered ? '#059669' : 'var(--accent)' }}>
                        {faceRegistered ? '✓ Configured' : '⚠ Pending'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Activity Summary */}
                <div className="card" style={{ padding: '2rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem' }}>
                    <Activity size={22} color="var(--primary)" />
                    <h3 style={{ fontSize: '1.15rem', fontWeight: '700', margin: 0 }}>Activity Summary</h3>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
                    <div style={{ padding: '1.5rem', background: 'rgba(9,82,155,0.05)', borderRadius: '12px', textAlign: 'center' }}>
                      <span style={{ fontSize: '2.5rem', fontWeight: '800', color: 'var(--primary)' }}>{myResults?.attempts?.length || 0}</span>
                      <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: '600', textTransform: 'uppercase' }}>Total Exams</p>
                    </div>
                    <div style={{ padding: '1.5rem', background: 'rgba(16,185,129,0.05)', borderRadius: '12px', textAlign: 'center' }}>
                      <span style={{ fontSize: '2.5rem', fontWeight: '800', color: '#059669' }}>{myResults?.attempts?.filter(a => a.examId?.resultsPublished).length || 0}</span>
                      <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: '600', textTransform: 'uppercase' }}>Results Out</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right: announcements */}
              <div className="card" style={{ padding: '1.75rem', height: 'fit-content' }}>
                <h2 style={{ fontSize: '1.1rem', fontWeight: '700', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Bell size={20} color="var(--accent)" /> Institutional Feed
                </h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                  {announcements.length === 0 ? (
                    <div style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '2rem', fontSize: '0.85rem', background: 'var(--background)', borderRadius: '8px' }}>
                      No new notifications.
                    </div>
                  ) : announcements.map((ann, index) => (
                    <div key={ann._id} style={{ borderBottom: index === announcements.length - 1 ? 'none' : '1px solid var(--border)', paddingBottom: '1rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                        <span style={{ fontSize: '0.7rem', color: 'var(--primary)', fontWeight: '700' }}>OFFICIAL</span>
                        <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>{new Date(ann.createdAt).toLocaleDateString()}</span>
                      </div>
                      <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '0.95rem', fontWeight: '700' }}>{ann.title}</h4>
                      <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: '1.5' }}>{ann.content}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════
            TAB: FACE SETUP (redirect)
        ══════════════════════════════════════ */}
        {activeTab === 'faceSetup' && (() => { navigate('/face-setup'); return null; })()}

      </main>
    </div>
  );
};

export default Dashboard;
