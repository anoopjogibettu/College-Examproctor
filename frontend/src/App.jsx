import React, { useContext, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthContext, AuthProvider } from './context/AuthContext';
import { ThemeProvider, ThemeContext } from './context/ThemeContext';
import { Sun, Moon, Menu, X } from 'lucide-react';
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

// Redirects already logged-in users away from login/register pages
const PublicRoute = ({ children }) => {
  const { user } = useContext(AuthContext);
  if (!user) return children;
  if (user.role === 'admin') return <Navigate to="/admin" />;
  if (user.role === 'moderator') return <Navigate to="/moderator" />;
  return <Navigate to="/" />;
};

// MITE Top Navigation Bar
const MITENavbar = () => {
  const { theme, toggleTheme } = useContext(ThemeContext);
  const { user } = useContext(AuthContext);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <nav style={{
      background: 'var(--primary)',
      color: 'white',
      padding: '0 1rem',
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
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <button 
          className="mobile-only" 
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          style={{ background: 'transparent', border: 'none', color: 'white', padding: '0.5rem', display: 'flex' }}
        >
          {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
        <a href="https://mite.ac.in" target="_blank" rel="noopener noreferrer"
          style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', textDecoration: 'none' }}>
          <img src="/Logo.svg" alt="MITE Logo" style={{ height: '40px' }} />
          <img src="/logo_name.png" alt="MITE" className="desktop-only" style={{ height: '28px', filter: 'brightness(0) invert(1)' }} />
        </a>
      </div>

      {/* Center: Portal title */}
      <div className="desktop-only" style={{ textAlign: 'center', position: 'absolute', left: '50%', transform: 'translateX(-50%)' }}>
        <div style={{ fontSize: '1rem', fontWeight: '700', letterSpacing: '0.5px', color: '#fff' }}>
          Exam Portal
        </div>
      </div>

      {/* Mobile Title */}
      <div className="mobile-only" style={{ fontSize: '0.9rem', fontWeight: '700' }}>
        MITE Portal
      </div>

      {/* Right Cluster */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <div className="desktop-only">
          {user && user.role === 'student' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
              <Link to="/" style={{ color: 'white', textDecoration: 'none', fontSize: '0.9rem', fontWeight: '600', opacity: 0.85 }}>Exams</Link>
              <Link to="/results" style={{ color: 'white', textDecoration: 'none', fontSize: '0.9rem', fontWeight: '600', opacity: 0.85 }}>Results</Link>
              <Link to="/profile" style={{ color: 'white', textDecoration: 'none', fontSize: '0.9rem', fontWeight: '600', opacity: 0.85 }}>Profile</Link>
            </div>
          )}
        </div>

        <button
          onClick={toggleTheme}
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
            cursor: 'pointer'
          }}
        >
          {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
        </button>
      </div>

      {/* Mobile Drawer Overlay */}
      {mobileMenuOpen && (
        <div 
          className="mobile-only"
          style={{
            position: 'fixed', top: '64px', left: 0, width: '100%', height: 'calc(100vh - 64px)',
            background: 'var(--surface)', zIndex: 1100, display: 'flex', flexDirection: 'column', padding: '2rem'
          }}
          onClick={() => setMobileMenuOpen(false)}
        >
           {user && user.role === 'student' && (
             <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
               <Link to="/" style={{ color: 'var(--text-primary)', textDecoration: 'none', fontSize: '1.2rem', fontWeight: '700' }}>🏠 Exams Home</Link>
               <Link to="/results" style={{ color: 'var(--text-primary)', textDecoration: 'none', fontSize: '1.2rem', fontWeight: '700' }}>📊 Academic Results</Link>
               <Link to="/profile" style={{ color: 'var(--text-primary)', textDecoration: 'none', fontSize: '1.2rem', fontWeight: '700' }}>👤 My Profile</Link>
             </div>
           )}
           {!user && (
             <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
               <Link to="/login" style={{ color: 'var(--text-primary)', textDecoration: 'none', fontSize: '1.2rem', fontWeight: '700' }}>🔑 Login</Link>
               <Link to="/register" style={{ color: 'var(--text-primary)', textDecoration: 'none', fontSize: '1.2rem', fontWeight: '700' }}>📝 Register</Link>
             </div>
           )}
           
           {user && (user.role === 'admin' || user.role === 'moderator') && (
             <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Management Tools</p>
                <Link to={user.role === 'admin' ? '/admin' : '/moderator'} style={{ color: 'var(--text-primary)', textDecoration: 'none', fontSize: '1.2rem', fontWeight: '700' }}>🛠 Dashboard</Link>
             </div>
           )}
        </div>
      )}
    </nav>
  );
};

const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
      <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />
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
