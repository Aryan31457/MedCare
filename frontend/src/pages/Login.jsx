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
              <input
                type="password"
                className="form-input"
                placeholder="••••••••"
                value={loginPassword}
                onChange={e => setLoginPassword(e.target.value)}
                required
              />
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
              <input
                type="password"
                className="form-input"
                placeholder="••••••••"
                value={regPassword}
                onChange={e => setRegPassword(e.target.value)}
                required
              />
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

        {!isRegister && (
          <div style={{ marginTop: 28, paddingTop: 20, borderTop: '1px solid var(--border)', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
            <div style={{ fontWeight: 700, marginBottom: 8, color: 'var(--text-secondary)' }}>Demo Accounts:</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <div><strong>Doctor Role:</strong> <code>doctor</code> / <code>doctor123</code></div>
              <div><strong>Patient Role:</strong> <code>diabetes</code> / <code>patient123</code></div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
