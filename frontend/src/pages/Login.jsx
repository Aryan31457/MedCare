import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../api/client.js'

export default function Login({ onLoginSuccess }) {
  const navigate = useNavigate()
  const [isRegister, setIsRegister] = useState(false)
  
  // Login fields
  const [usernameOrEmail, setUsernameOrEmail] = useState('')
  const [loginPassword, setLoginPassword] = useState('')

  // Register fields
  const [regUsername, setRegUsername] = useState('')
  const [regEmail, setRegEmail] = useState('')
  const [regPassword, setRegPassword] = useState('')
  const [regRole, setRegRole] = useState('doctor') // 'doctor' or 'patient'
  
  // Patient fields for registration
  const [patName, setPatName] = useState('')
  const [patAge, setPatAge] = useState('')
  const [patSex, setPatSex] = useState('Male')

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)
  const [showLoginPassword, setShowLoginPassword] = useState(false)
  const [showRegPassword, setShowRegPassword] = useState(false)

  const handleLoginSubmit = async (e) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)
    setLoading(true)

    try {
      const response = await api.login(usernameOrEmail, loginPassword)
      
      localStorage.setItem('role', response.role)
      localStorage.setItem('auth', 'true')
      if (response.patient_id) {
        localStorage.setItem('patientId', response.patient_id)
      }

      onLoginSuccess(response.role, response.patient_id)
      
      if (response.role === 'doctor') {
        navigate('/')
      } else {
        navigate(`/patient/${response.patient_id}`)
      }
    } catch (err) {
      setError(err.message || 'Invalid username/email or password.')
    } finally {
      setLoading(false)
    }
  }

  const handleRegisterSubmit = async (e) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)
    setLoading(true)

    try {
      const payload = {
        username: regUsername.trim(),
        email: regEmail.trim(),
        password: regPassword,
        role: regRole
      }

      if (regRole === 'patient') {
        payload.name = patName.trim()
        payload.age = parseInt(patAge) || 0
        payload.sex = patSex
      }

      const response = await api.register(payload)
      setSuccess('Account created successfully! Logging you in...')
      
      // Auto login
      setTimeout(() => {
        localStorage.setItem('role', response.role)
        localStorage.setItem('auth', 'true')
        if (response.patient_id) {
          localStorage.setItem('patientId', response.patient_id)
        }
        onLoginSuccess(response.role, response.patient_id)
        if (response.role === 'doctor') {
          navigate('/')
        } else {
          navigate(`/patient/${response.patient_id}`)
        }
      }, 1500)

    } catch (err) {
      setError(err.message || 'Registration failed. Try a different username/email.')
      setLoading(false)
    }
  }

  return (
    <div className="login-page-container" style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      background: 'var(--bg-base)',
      fontFamily: "'Plus Jakarta Sans', sans-serif",
      padding: 24
    }}>
      <div className="card" style={{ maxWidth: 440, width: '100%', padding: 40, borderRadius: 20, boxShadow: '0 20px 40px rgba(0,0,0,0.04)' }}>
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{ fontSize: '2.5rem', marginBottom: 12 }}>🌱</div>
          <h2 style={{ fontFamily: "'Outfit', sans-serif", fontSize: '1.65rem', fontWeight: 800, color: 'var(--text-primary)' }}>
            {isRegister ? 'Create Account' : 'Welcome to MedCare'}
          </h2>
          <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', marginTop: 4 }}>
            {isRegister ? 'Register as a doctor or patient' : 'Sign in to access your portal'}
          </p>
        </div>

        {error && (
          <div className="alert danger" style={{ marginBottom: 24, padding: '12px 16px', borderRadius: 8, fontSize: '0.85rem' }}>
            <span>⚠️ </span> {error}
          </div>
        )}

        {success && (
          <div className="alert success" style={{ marginBottom: 24, padding: '12px 16px', borderRadius: 8, fontSize: '0.85rem', background: '#e8f5e9', color: '#2e7d32', border: '1px solid #c8e6c9' }}>
            <span>✓ </span> {success}
          </div>
        )}

        {!isRegister ? (
          // Sign In Form
          <form onSubmit={handleLoginSubmit}>
            <div className="form-group" style={{ marginBottom: 18 }}>
              <label className="form-label">Username or Email</label>
              <input
                type="text"
                className="form-input"
                placeholder="doctor or diabetes"
                value={usernameOrEmail}
                onChange={e => setUsernameOrEmail(e.target.value)}
                required
              />
            </div>
            <div className="form-group" style={{ marginBottom: 24 }}>
              <label className="form-label">Password</label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showLoginPassword ? 'text' : 'password'}
                  className="form-input"
                  style={{ paddingRight: 40 }}
                  placeholder="••••••••"
                  value={loginPassword}
                  onChange={e => setLoginPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowLoginPassword(!showLoginPassword)}
                  style={{
                    position: 'absolute',
                    right: 12,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: '1.1rem',
                    padding: 0,
                    display: 'flex',
                    alignItems: 'center',
                    color: 'var(--text-muted)'
                  }}
                >
                  {showLoginPassword ? (
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" style={{ width: 20, height: 20 }}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 0 0 1.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.451 10.451 0 0 1 12 4.5c4.756 0 8.773 3.162 10.065 7.498a10.522 10.522 0 0 1-4.293 5.774M6.228 6.228 3 3m3.228 3.228 3.65 3.65m7.894 7.894L21 21m-3.228-3.228-3.65-3.65m0 0a3 3 0 1 0-4.243-4.243m4.242 4.242L9.88 9.88" />
                    </svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" style={{ width: 20, height: 20 }}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            <button type="submit" className="btn btn-primary btn-lg" style={{ width: '100%', justifyContent: 'center' }} disabled={loading}>
              {loading ? <><span className="spinner" /> Signing in...</> : 'Sign In'}
            </button>
            
            <div style={{ marginTop: 20, textAlign: 'center', fontSize: '0.85rem' }}>
              <span style={{ color: 'var(--text-secondary)' }}>New to MedCare? </span>
              <button type="button" onClick={() => { setIsRegister(true); setError(null); setSuccess(null); }} style={{ background: 'none', border: 'none', color: 'var(--green)', fontWeight: 700, cursor: 'pointer', textDecoration: 'underline', padding: 0 }}>
                Create Account
              </button>
            </div>
          </form>
        ) : (
          // Register Form
          <form onSubmit={handleRegisterSubmit}>
            <div className="form-group" style={{ marginBottom: 14 }}>
              <label className="form-label">Username</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. johndoe"
                value={regUsername}
                onChange={e => setRegUsername(e.target.value)}
                required
              />
            </div>
            <div className="form-group" style={{ marginBottom: 14 }}>
              <label className="form-label">Email Address</label>
              <input
                type="email"
                className="form-input"
                placeholder="johndoe@example.com"
                value={regEmail}
                onChange={e => setRegEmail(e.target.value)}
                required
              />
            </div>
            <div className="form-group" style={{ marginBottom: 14 }}>
              <label className="form-label">Password</label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showRegPassword ? 'text' : 'password'}
                  className="form-input"
                  style={{ paddingRight: 40 }}
                  placeholder="••••••••"
                  value={regPassword}
                  onChange={e => setRegPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowRegPassword(!showRegPassword)}
                  style={{
                    position: 'absolute',
                    right: 12,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: '1.1rem',
                    padding: 0,
                    display: 'flex',
                    alignItems: 'center',
                    color: 'var(--text-muted)'
                  }}
                >
                  {showRegPassword ? (
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" style={{ width: 20, height: 20 }}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 0 0 1.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.451 10.451 0 0 1 12 4.5c4.756 0 8.773 3.162 10.065 7.498a10.522 10.522 0 0 1-4.293 5.774M6.228 6.228 3 3m3.228 3.228 3.65 3.65m7.894 7.894L21 21m-3.228-3.228-3.65-3.65m0 0a3 3 0 1 0-4.243-4.243m4.242 4.242L9.88 9.88" />
                    </svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" style={{ width: 20, height: 20 }}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>
            <div className="form-group" style={{ marginBottom: regRole === 'patient' ? 14 : 24 }}>
              <label className="form-label">I am a...</label>
              <select className="form-select" value={regRole} onChange={e => setRegRole(e.target.value)}>
                <option value="doctor">🏥 Doctor / Clinician</option>
                <option value="patient">🌱 Recovering Patient</option>
              </select>
            </div>

            {regRole === 'patient' && (
              <div style={{ padding: 14, background: '#f0f6f3', borderRadius: 10, border: '1px solid var(--border)', marginBottom: 24 }}>
                <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--green)', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Patient Demographics</div>
                <div className="form-group" style={{ marginBottom: 12 }}>
                  <label className="form-label" style={{ fontSize: '0.72rem' }}>Full Name *</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. John Doe"
                    value={patName}
                    onChange={e => setPatName(e.target.value)}
                    required
                  />
                </div>
                <div style={{ display: 'flex', gap: 10 }}>
                  <div className="form-group" style={{ flex: 1 }}>
                    <label className="form-label" style={{ fontSize: '0.72rem' }}>Age *</label>
                    <input
                      type="number"
                      className="form-input"
                      placeholder="35"
                      min={0}
                      value={patAge}
                      onChange={e => setPatAge(e.target.value)}
                      required
                    />
                  </div>
                  <div className="form-group" style={{ flex: 1 }}>
                    <label className="form-label" style={{ fontSize: '0.72rem' }}>Sex *</label>
                    <select className="form-select" value={patSex} onChange={e => setPatSex(e.target.value)}>
                      <option>Male</option>
                      <option>Female</option>
                      <option>Other</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            <button type="submit" className="btn btn-primary btn-lg" style={{ width: '100%', justifyContent: 'center' }} disabled={loading}>
              {loading ? <><span className="spinner" /> Creating Account...</> : 'Create Account'}
            </button>
            
            <div style={{ marginTop: 20, textAlign: 'center', fontSize: '0.85rem' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Already have an account? </span>
              <button type="button" onClick={() => { setIsRegister(false); setError(null); setSuccess(null); }} style={{ background: 'none', border: 'none', color: 'var(--green)', fontWeight: 700, cursor: 'pointer', textDecoration: 'underline', padding: 0 }}>
                Sign In
              </button>
            </div>
          </form>
        )}

      </div>
    </div>
  )
}
