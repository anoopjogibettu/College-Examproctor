import React, { useState, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { User as UserIcon, Lock, Mail } from 'lucide-react';

const Register = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [stream, setStream] = useState('Degree');
  const [specialization, setSpecialization] = useState('');
  const [error, setError] = useState('');
  const { register } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await register(name, email, password, stream, specialization);
      navigate('/login');
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed');
    }
  };

  return (
    <div className="main-content flex items-center justify-center">
      <div className="card w-full animate-fade-in" style={{ maxWidth: '400px' }}>
        <div className="text-center mb-4">
          <h2 className="text-gradient" style={{ fontSize: '2rem' }}>Create Account</h2>
          <p style={{ color: 'var(--text-secondary)' }}>Join ProctorAI to take secure exams</p>
        </div>
        
        {error && <div className="badge badge-terminated w-full text-center mb-4" style={{ padding: '0.75rem' }}>{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Full Name</label>
            <div style={{ position: 'relative' }}>
              <UserIcon size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
              <input
                type="text"
                className="input"
                style={{ paddingLeft: '2.5rem' }}
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Email</label>
            <div style={{ position: 'relative' }}>
              <Mail size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
              <input
                type="email"
                className="input"
                style={{ paddingLeft: '2.5rem' }}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Password</label>
            <div style={{ position: 'relative' }}>
              <Lock size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
              <input
                type="password"
                className="input"
                style={{ paddingLeft: '2.5rem' }}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
          </div>
          <div className="form-group mb-6">
            <label className="form-label">Academic Stream</label>
            <div style={{ position: 'relative' }}>
              <select className="input" style={{ width: '100%' }} value={stream} onChange={e => setStream(e.target.value)}>
                 <option value="PUC">PUC (Pre-University)</option>
                 <option value="Degree">Degree Program</option>
                 <option value="Engineering">Engineering</option>
                 <option value="Post Graduation">Post Graduation</option>
              </select>
            </div>
          </div>
          <div className="form-group mb-6">
            <label className="form-label">Branch & Specialization</label>
            <div style={{ position: 'relative' }}>
              <input
                type="text"
                className="input"
                style={{ width: '100%' }}
                placeholder={stream === 'Engineering' ? 'e.g. Computer Science' : stream === 'PUC' ? 'e.g. PCMB' : 'What is your major?'}
                value={specialization}
                onChange={(e) => setSpecialization(e.target.value)}
                required
              />
            </div>
          </div>
          <button type="submit" className="btn btn-primary w-full justify-center">Register</button>
        </form>

        <p className="text-center mt-4" style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
          Already have an account? <Link to="/login" style={{ color: 'var(--primary)', textDecoration: 'none' }}>Login</Link>
        </p>
      </div>
    </div>
  );
};

export default Register;
