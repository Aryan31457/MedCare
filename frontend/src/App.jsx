import { useState } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/Layout.jsx'
import Dashboard from './pages/Dashboard.jsx'
import NewCase from './pages/NewCase.jsx'
import CaseDetail from './pages/CaseDetail.jsx'
import CarePlanView from './pages/CarePlanView.jsx'
import ReviewQueue from './pages/ReviewQueue.jsx'
import Login from './pages/Login.jsx'
import { PatientDashboard } from './pages/PatientDashboardView.jsx'

export default function App() {
  const [auth, setAuth] = useState(() => localStorage.getItem('auth') === 'true')
  const [role, setRole] = useState(() => localStorage.getItem('role'))
  const [patientId, setPatientId] = useState(() => localStorage.getItem('patientId'))

  const handleLoginSuccess = (userRole, patientIdVal = null) => {
    setAuth(true)
    setRole(userRole)
    setPatientId(patientIdVal)
  }

  const handleLogout = () => {
    localStorage.removeItem('auth')
    localStorage.removeItem('role')
    localStorage.removeItem('patientId')
    setAuth(false)
    setRole(null)
    setPatientId(null)
  }

  if (!auth) {
    return (
      <Routes>
        <Route path="*" element={<Login onLoginSuccess={handleLoginSuccess} />} />
      </Routes>
    )
  }

  if (role === 'doctor') {
    return (
      <Layout onLogout={handleLogout}>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/cases/new" element={<NewCase />} />
          <Route path="/cases/:id" element={<CaseDetail />} />
          <Route path="/cases/:id/plan" element={<CarePlanView />} />
          <Route path="/review" element={<ReviewQueue />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Layout>
    )
  }

  // Else, role === 'patient'
  return (
    <Routes>
      <Route path="/" element={<Navigate to={`/patient/${patientId}`} replace />} />
      <Route path="/patient/:patientId" element={<PatientDashboard onLogout={handleLogout} />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
