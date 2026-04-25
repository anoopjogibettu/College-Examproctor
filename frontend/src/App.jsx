import React, { useContext } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthContext, AuthProvider } from './context/AuthContext';
import { ThemeProvider, ThemeContext } from './context/ThemeContext';
import { Sun, Moon } from 'lucide-react';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import FaceSetup from './pages/FaceSetup';
import ExamSession from './pages/ExamSession';
import AdminDashboard from './pages/AdminDashboard';
import ModeratorDashboard from './pages/ModeratorDashboard';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import Profile from './pages/Profile';
import Results from './pages/Results';
import { Link } from 'react-router-dom';

const PrivateRoute = ({ children, roleRequired }) => {
  const { user } = useContext(AuthContext);
  if (!user) return <Navigate to="/login" />;
  if (roleRequired && user.role !== roleRequired) return <Navigate to="/" />;
  return children;
};

// MITE Top Navigation Bar
const MITENavbar = () => {
  const { theme, toggleTheme } = useContext(ThemeContext);
  const { user } = useContext(AuthContext);

  return (
    <nav style={{
      background: 'var(--primary)',
      color: 'white',
      padding: '0 2rem',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      height: '64px',
      boxShadow: '0 2px 8px rgba(9,82,155,0.25)',
      position: 'sticky',
      top: 0,
      zIndex: 1000,
      flexShrink: 0
    }}>
      {/* Left: Logo */}
      <a href="https://mite.ac.in" target="_blank" rel="noopener noreferrer"
        style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', textDecoration: 'none' }}>
        <img src="/Logo.svg" alt="MITE Logo" style={{ height: '48px' }} />
        <img src="/logo_name.png" alt="MITE" style={{ height: '32px', filter: 'brightness(0) invert(1)' }} />
      </a>

      {/* Center: Portal title (Absolute Centered) */}
      <div style={{ textAlign: 'center', position: 'absolute', left: '50%', transform: 'translateX(-50%)' }}>
        <div style={{ fontSize: '1rem', fontWeight: '700', letterSpacing: '0.5px', color: '#fff' }}>
          Exam Portal
        </div>
      </div>

      {/* Right Cluster: Student Links + Theme Toggle */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
        {/* Student Specific Links - Hidden from Admin/Mod */}
        {user && user.role === 'student' && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
            <Link to="/" style={{ color: 'white', textDecoration: 'none', fontSize: '0.9rem', fontWeight: '600', opacity: 0.85, transition: 'opacity 0.2s' }} onMouseEnter={e => e.currentTarget.style.opacity = 1} onMouseLeave={e => e.currentTarget.style.opacity = 0.85}>Exams</Link>
            <Link to="/results" style={{ color: 'white', textDecoration: 'none', fontSize: '0.9rem', fontWeight: '600', opacity: 0.85, transition: 'opacity 0.2s' }} onMouseEnter={e => e.currentTarget.style.opacity = 1} onMouseLeave={e => e.currentTarget.style.opacity = 0.85}>Results</Link>
            <Link to="/profile" style={{ color: 'white', textDecoration: 'none', fontSize: '0.9rem', fontWeight: '600', opacity: 0.85, transition: 'opacity 0.2s' }} onMouseEnter={e => e.currentTarget.style.opacity = 1} onMouseLeave={e => e.currentTarget.style.opacity = 0.85}>Profile</Link>
          </div>
        )}

        <button
          onClick={toggleTheme}
          title="Toggle Theme"
          style={{
            background: 'rgba(255,255,255,0.15)',
            border: '1px solid rgba(255,255,255,0.3)',
            borderRadius: '8px',
            color: 'white',
            width: '38px',
            height: '38px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            transition: 'background 0.2s'
          }}
          onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.25)'}
          onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.15)'}
        >
          {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
        </button>
      </div>
    </nav>
  );
};

const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
      <Route path="/results" element={<PrivateRoute><Results /></PrivateRoute>} />
      <Route path="/profile" element={<PrivateRoute><Profile /></PrivateRoute>} />
      <Route path="/face-setup" element={<PrivateRoute><FaceSetup /></PrivateRoute>} />
      <Route path="/exam/:id" element={<PrivateRoute><ExamSession /></PrivateRoute>} />
      <Route path="/admin" element={<PrivateRoute roleRequired="admin"><AdminDashboard /></PrivateRoute>} />
      <Route path="/moderator" element={<PrivateRoute roleRequired="moderator"><ModeratorDashboard /></PrivateRoute>} />
    </Routes>
  );
};

function App() {
  return (
    <ThemeProvider>
      <Router>
        <AuthProvider>
          <div className="app-container">
            <MITENavbar />
            <div style={{ flex: 1 }}>
              <AppRoutes />
            </div>
          </div>
        </AuthProvider>
      </Router>
    </ThemeProvider>
  );
}

export default App;
