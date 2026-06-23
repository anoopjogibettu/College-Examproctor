import React, { useContext, Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthContext, AuthProvider } from './context/AuthContext';
import { ThemeProvider, ThemeContext } from './context/ThemeContext';
import { Sun, Moon } from 'lucide-react';

/**
 * Code-split every page with React.lazy().
 * Each page becomes a separate JS chunk that is only downloaded when the
 * user navigates to that route — dramatically reducing the amount of JS
 * React must parse before it can paint the LCP element.
 *
 * AdminDashboard alone is ~105 KB of JS; lazy-loading it means
 * the /login and / routes are unaffected by its size.
 */
const Login         = lazy(() => import('./pages/Login'));
const Register      = lazy(() => import('./pages/Register'));
const Dashboard     = lazy(() => import('./pages/Dashboard'));
const FaceSetup     = lazy(() => import('./pages/FaceSetup'));
const ExamSession   = lazy(() => import('./pages/ExamSession'));
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'));
const ForgotPassword = lazy(() => import('./pages/ForgotPassword'));
const ResetPassword  = lazy(() => import('./pages/ResetPassword'));

/** Minimal full-page spinner shown while a lazy chunk loads. */
const PageLoader = () => (
  <div style={{
    minHeight: '60vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'column',
    gap: '1rem',
    color: 'var(--text-secondary)'
  }}>
    <div style={{
      width: '36px', height: '36px',
      border: '3px solid var(--border)',
      borderTopColor: 'var(--primary)',
      borderRadius: '50%',
      animation: 'spin 0.75s linear infinite'
    }} />
    <span style={{ fontSize: '0.85rem', fontWeight: '500' }}>Loading…</span>
  </div>
);


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
  const location = useLocation();

  if (location.pathname.startsWith('/exam/')) {
    return null;
  }

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
        {/* fetchpriority="high" tells the browser this is the LCP image.
            Even though it's rendered by React (late discovery), the
            priority hint pushes it to the front of the network queue,
            cutting the render delay measured in the audit. */}
        <img
          src="/logo_name.png"
          alt="MITE"
          fetchpriority="high"
          width="auto"
          height="32"
          style={{ height: '32px', filter: 'brightness(0) invert(1)' }}
        />
      </a>

      {/* Center: Portal title (Absolute Centered) */}
      <div style={{ textAlign: 'center', position: 'absolute', left: '50%', transform: 'translateX(-50%)' }}>
        <div style={{ fontSize: '1rem', fontWeight: '700', letterSpacing: '0.5px', color: '#fff' }}>
          Exam Portal
        </div>
      </div>

      {/* Right Cluster: Theme Toggle only */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>

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
    // Suspense catches the lazy() promise thrown by each page component
    // and shows PageLoader until the chunk has downloaded and parsed.
    <Suspense fallback={<PageLoader />}>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/" element={<PrivateRoute><Dashboard /></PrivateRoute>} />

        <Route path="/face-setup" element={<PrivateRoute><FaceSetup /></PrivateRoute>} />
        <Route path="/exam/:id" element={<PrivateRoute><ExamSession /></PrivateRoute>} />
        <Route path="/admin" element={<PrivateRoute roleRequired="admin"><AdminDashboard /></PrivateRoute>} />
      </Routes>
    </Suspense>
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
