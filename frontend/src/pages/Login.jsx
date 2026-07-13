import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../api/client.js'

export default function Login({ onLoginSuccess }) {
  const navigate = useNavigate()
  const [usernameOrEmail, setUsernameOrEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      // Call backend API login
      const response = await api.login(usernameOrEmail, password)
      
      // Save authenticated details
      localStorage.setItem('role', response.role)
      localStorage.setItem('auth', 'true')
      if (response.patient_id) {
        localStorage.setItem('patientId', response.patient_id)
      }

      onLoginSuccess(response.role, response.patient_id)
      
      // Redirect based on role
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
      <div className="card" style={{ maxWidth: 420, width: '100%', padding: 40, borderRadius: 20, boxShadow: '0 20px 40px rgba(0,0,0,0.04)' }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ fontSize: '2.5rem', marginBottom: 12 }}>🌱</div>
          <h2 style={{ fontFamily: "'Outfit', sans-serif", fontSize: '1.65rem', fontWeight: 800, color: 'var(--text-primary)' }}>Welcome to MedCare</h2>
          <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', marginTop: 4 }}>Sign in to access your portal</p>
        </div>

        {error && (
          <div className="alert danger" style={{ marginBottom: 24, padding: '12px 16px', borderRadius: 8, fontSize: '0.85rem' }}>
            <span>⚠️ </span> {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group" style={{ marginBottom: 20 }}>
            <label className="form-label">Username or Email</label>
            <input
              type="text"
              className="form-input"
              placeholder="e.g. doctor or diabetes"
              value={usernameOrEmail}
              onChange={e => setUsernameOrEmail(e.target.value)}
              required
            />
          </div>
          <div className="form-group" style={{ marginBottom: 28 }}>
            <label className="form-label">Password</label>
            <input
              type="password"
              className="form-input"
              placeholder="••••••••"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
            />
          </div>

          <button type="submit" className="btn btn-primary btn-lg" style={{ width: '100%', justifyContent: 'center' }} disabled={loading}>
            {loading ? <><span className="spinner" /> Signing in...</> : 'Sign In'}
          </button>
        </form>

        <div style={{ marginTop: 28, paddingTop: 20, borderTop: '1px solid var(--border)', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
          <div style={{ fontWeight: 700, marginBottom: 8, color: 'var(--text-secondary)' }}>Demo Accounts:</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <div><strong>Doctor Role:</strong></div>
            <div style={{ paddingLeft: 8 }}>
              • Username: <code>doctor</code> (or <code>doctor@medcare.com</code>)<br/>
              • Password: <code>doctor123</code>
            </div>
            
            <div style={{ marginTop: 4 }}><strong>Patient Role (David Miller):</strong></div>
            <div style={{ paddingLeft: 8 }}>
              • Username: <code>diabetes</code> (or <code>diabetes@gmail.com</code>)<br/>
              • Password: <code>patient123</code>
            </div>

            <div style={{ marginTop: 4 }}><strong>Patient Role (Sarah Jenkins):</strong></div>
            <div style={{ paddingLeft: 8 }}>
              • Username: <code>cardiac</code> (or <code>cardiac@gmail.com</code>)<br/>
              • Password: <code>patient123</code>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
