import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../api/client.js'

export default function Login({ onLoginSuccess }) {
  const navigate = useNavigate()
  const [role, setRole] = useState('doctor') // 'doctor' or 'patient'
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [selectedPatientId, setSelectedPatientId] = useState('')
  const [patients, setPatients] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (role === 'patient') {
      api.getPatientsAll()
        .then(setPatients)
        .catch(err => console.error("Error loading patients:", err))
    }
  }, [role])

  const handleSubmit = (e) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    // Quick mock validation
    if (role === 'doctor') {
      if (username.trim() === 'doctor' && password === 'doctor123') {
        localStorage.setItem('role', 'doctor')
        localStorage.setItem('auth', 'true')
        onLoginSuccess('doctor')
        navigate('/')
      } else {
        setError('Invalid username or password. (Hint: doctor / doctor123)')
      }
    } else {
      if (selectedPatientId && password === 'patient123') {
        localStorage.setItem('role', 'patient')
        localStorage.setItem('patientId', selectedPatientId)
        localStorage.setItem('auth', 'true')
        onLoginSuccess('patient', selectedPatientId)
        navigate(`/patient/${selectedPatientId}`)
      } else if (!selectedPatientId) {
        setError('Please select a patient profile.')
      } else {
        setError('Invalid password. (Hint: patient123)')
      }
    }
    setLoading(false)
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
      <div className="card" style={{ maxWidth: 440, width: '100%', padding: 36, borderRadius: 20, boxShadow: '0 20px 40px rgba(0,0,0,0.04)' }}>
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{ fontSize: '2.5rem', marginBottom: 12 }}>🌱</div>
          <h2 style={{ fontFamily: "'Outfit', sans-serif", fontSize: '1.6rem', fontWeight: 800, color: 'var(--text-primary)' }}>Welcome to MedCare</h2>
          <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', marginTop: 4 }}>Select your access role to continue</p>
        </div>

        {/* Role Selector Tabs */}
        <div style={{ display: 'flex', gap: 8, background: '#e2ece8', padding: 4, borderRadius: 10, marginBottom: 24 }}>
          <button
            type="button"
            onClick={() => { setRole('doctor'); setError(null); }}
            style={{
              flex: 1,
              padding: '10px 14px',
              border: 'none',
              borderRadius: 8,
              fontSize: '0.88rem',
              fontWeight: 600,
              cursor: 'pointer',
              background: role === 'doctor' ? '#ffffff' : 'transparent',
              color: role === 'doctor' ? 'var(--green)' : 'var(--text-secondary)',
              boxShadow: role === 'doctor' ? '0 4px 10px rgba(0,0,0,0.03)' : 'none',
              transition: 'all 0.2s'
            }}
          >
            🏥 Doctor / Clinician
          </button>
          <button
            type="button"
            onClick={() => { setRole('patient'); setError(null); }}
            style={{
              flex: 1,
              padding: '10px 14px',
              border: 'none',
              borderRadius: 8,
              fontSize: '0.88rem',
              fontWeight: 600,
              cursor: 'pointer',
              background: role === 'patient' ? '#ffffff' : 'transparent',
              color: role === 'patient' ? 'var(--green)' : 'var(--text-secondary)',
              boxShadow: role === 'patient' ? '0 4px 10px rgba(0,0,0,0.03)' : 'none',
              transition: 'all 0.2s'
            }}
          >
            🌱 Patient Companion
          </button>
        </div>

        {error && (
          <div className="alert danger" style={{ marginBottom: 20, padding: '10px 14px', borderRadius: 8, fontSize: '0.85rem' }}>
            <span>⚠️ </span> {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {role === 'doctor' ? (
            <>
              <div className="form-group" style={{ marginBottom: 16 }}>
                <label className="form-label">Username</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="doctor"
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  required
                />
              </div>
              <div className="form-group" style={{ marginBottom: 24 }}>
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
            </>
          ) : (
            <>
              <div className="form-group" style={{ marginBottom: 16 }}>
                <label className="form-label">Select Patient Profile</label>
                <select
                  className="form-select"
                  value={selectedPatientId}
                  onChange={e => setSelectedPatientId(e.target.value)}
                  required
                >
                  <option value="">-- Choose Profile --</option>
                  {patients.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.age}y · {p.sex})
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group" style={{ marginBottom: 24 }}>
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
            </>
          )}

          <button type="submit" className="btn btn-primary btn-lg" style={{ width: '100%', justifyContent: 'center' }}>
            Sign In
          </button>
        </form>

        <div style={{ marginTop: 24, textAlign: 'center', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
          <div style={{ fontWeight: 600 }}>Demo Credentials:</div>
          <div>Doctor: <code>doctor</code> / <code>doctor123</code></div>
          <div>Patient: Select profile & use <code>patient123</code></div>
        </div>
      </div>
    </div>
  )
}
