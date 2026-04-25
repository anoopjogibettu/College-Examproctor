import React, { useState, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

// MITE Official Engineering Branches (from mite.ac.in)
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

// MITE PG Programs
const PG_PROGRAMS = [
  'Master of Computer Applications (MCA)',
  'Master of Business Administration (MBA)',
  'Master of Technology (M.Tech) in Computer Science & Engg.',
];

const Register = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [stream, setStream] = useState('Engineering');
  const [branch, setBranch] = useState('');
  const [specialization, setSpecialization] = useState('');
  const [year, setYear] = useState('1');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otpLoading, setOtpLoading] = useState(false);
  const { register, sendOtp } = useContext(AuthContext);
  const navigate = useNavigate();

  const isEngineering = stream === 'Engineering';
  const yearOptions = isEngineering
    ? ['1st Year', '2nd Year', '3rd Year', '4th Year']
    : ['1st Year', '2nd Year'];

  const handleSendOtp = async () => {
    if (!email.endsWith('@mite.ac.in')) {
      setError('Only @mite.ac.in email addresses are permitted.');
      return;
    }
    setOtpLoading(true);
    setError('');
    try {
      await sendOtp(email);
      setOtpSent(true);
      alert('Verification OTP sent to your MITE email.');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send OTP.');
    } finally {
      setOtpLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Frontend email guard
    if (!email.endsWith('@mite.ac.in')) {
      setError('Only @mite.ac.in email addresses are permitted to register.');
      return;
    }

    if (isEngineering && !branch) {
      setError('Branch is mandatory for Engineering students.');
      return;
    }

    if (!otpSent) {
      setError('Please verify your email with an OTP first.');
      return;
    }

    setLoading(true);
    try {
      await register(name, email, password, stream, branch, specialization, parseInt(year), otp);
      navigate('/login');
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const labelStyle = {
    display: 'block',
    fontSize: '0.8rem',
    fontWeight: '600',
    marginBottom: '0.4rem',
    color: 'var(--text-secondary)',
    textTransform: 'uppercase',
    letterSpacing: '0.5px'
  };

  const inputStyle = {
    width: '100%',
    padding: '0.7rem 1rem',
    background: 'var(--background)',
    border: '1px solid var(--border)',
    borderRadius: '6px',
    color: 'var(--text-primary)',
    fontSize: '0.95rem',
    outline: 'none',
    transition: 'border-color 0.2s'
  };

  return (
    <div style={{ minHeight: 'calc(100vh - 64px)', background: 'var(--background)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem 1rem' }}>
      <div style={{ width: '100%', maxWidth: '480px', background: 'var(--surface)', borderRadius: '10px', boxShadow: 'var(--shadow-lg)', border: '1px solid var(--border)', overflow: 'hidden' }}>

        {/* Header strip */}
        <div style={{ background: 'var(--primary)', padding: '1.5rem 2rem', borderBottom: '4px solid var(--accent)' }}>
          <h1 style={{ color: '#fff', fontSize: '1.3rem', fontWeight: '700', margin: 0 }}>Student Registration</h1>
          <p style={{ color: 'rgba(255,255,255,0.75)', fontSize: '0.85rem', margin: '0.25rem 0 0' }}>
            Restricted to <strong>@mite.ac.in</strong> email addresses
          </p>
        </div>

        <div style={{ padding: '2rem' }}>
          {error && (
            <div style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.3)', color: '#dc2626', padding: '0.75rem 1rem', borderRadius: '6px', fontSize: '0.875rem', marginBottom: '1.25rem' }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>

            {/* Full Name */}
            <div>
              <label style={labelStyle}>Full Name</label>
              <input className="input" type="text" value={name} onChange={e => setName(e.target.value)} required placeholder="e.g. Azure " />
            </div>

            {/* Email */}
            <div>
              <label style={labelStyle}>Institutional Email</label>
              <div className="flex gap-2" style={{ display: 'flex', gap: '0.5rem' }}>
                <input
                  className="input"
                  type="email"
                  value={email}
                  onChange={e => { setEmail(e.target.value); setOtpSent(false); }}
                  required
                  placeholder="yourname@mite.ac.in"
                  style={{ flex: 1 }}
                />
                <button
                  type="button"
                  onClick={handleSendOtp}
                  disabled={otpLoading || !email.endsWith('@mite.ac.in') || otpSent}
                  className="btn"
                  style={{
                    background: otpSent ? 'var(--success)' : 'var(--primary)',
                    color: '#fff',
                    padding: '0.5rem 1rem',
                    fontSize: '0.8rem',
                    whiteSpace: 'nowrap'
                  }}
                >
                  {otpLoading ? '...' : (otpSent ? 'OTP Sent' : 'Send OTP')}
                </button>
              </div>
              {email && !email.endsWith('@mite.ac.in') && (
                <p style={{ color: '#dc2626', fontSize: '0.78rem', marginTop: '0.3rem' }}>⚠ Must end with @mite.ac.in</p>
              )}
            </div>

            {/* OTP Input */}
            {otpSent && (
              <div className="animate-fade-in">
                <label style={labelStyle}>Verification Code (OTP)</label>
                <input
                  className="input"
                  type="text"
                  value={otp}
                  onChange={e => setOtp(e.target.value)}
                  required
                  placeholder="6-digit code"
                  maxLength={6}
                  style={{ border: '2px solid var(--primary)', background: 'rgba(9, 82, 155, 0.05)' }}
                />
              </div>
            )}

            {/* Password */}
            <div>
              <label style={labelStyle}>Password</label>
              <input className="input" type="password" value={password} onChange={e => setPassword(e.target.value)} required placeholder="Min. 8 characters" minLength={6} />
            </div>

            {/* Academic Stream */}
            <div>
              <label style={labelStyle}>Academic Programme</label>
              <select className="input" value={stream} onChange={e => { setStream(e.target.value); setBranch(''); setSpecialization(''); setYear('1'); }}>
                <option value="Engineering">Engineering (B.E.)</option>
                <option value="Post Graduation">Post Graduation</option>
              </select>
            </div>

            {/* Engineering: mandatory Branch */}
            {isEngineering && (
              <div>
                <label style={labelStyle}>Branch <span style={{ color: '#dc2626' }}>*</span></label>
                <select className="input" value={branch} onChange={e => setBranch(e.target.value)} required>
                  <option value="">— Select your branch —</option>
                  {ENGINEERING_BRANCHES.map(b => (
                    <option key={b} value={b}>{b}</option>
                  ))}
                </select>
              </div>
            )}

            {/* PG: optional Specialization/Program */}
            {!isEngineering && (
              <div>
                <label style={labelStyle}>PG Programme <span style={{ color: 'var(--text-secondary)', fontWeight: 400 }}>(optional)</span></label>
                <select className="input" value={specialization} onChange={e => setSpecialization(e.target.value)}>
                  <option value="">— Select programme —</option>
                  {PG_PROGRAMS.map(p => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
              </div>
            )}

            {/* Year */}
            <div>
              <label style={labelStyle}>Current Year of Study</label>
              <select className="input" value={year} onChange={e => setYear(e.target.value)} required>
                {yearOptions.map((y, i) => (
                  <option key={i} value={String(i + 1)}>{y}</option>
                ))}
              </select>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              style={{
                marginTop: '0.5rem',
                padding: '0.85rem',
                background: loading ? 'var(--text-secondary)' : 'var(--primary)',
                color: '#fff',
                border: 'none',
                borderRadius: '6px',
                fontSize: '1rem',
                fontWeight: '600',
                cursor: loading ? 'not-allowed' : 'pointer',
                transition: 'background 0.2s'
              }}
            >
              {loading ? 'Registering...' : 'Create Account'}
            </button>
          </form>

          <p style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
            Already have an account?{' '}
            <Link to="/login" style={{ color: 'var(--primary)', fontWeight: '600', textDecoration: 'none' }}>Sign In</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;
