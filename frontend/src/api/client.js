const DOCTOR_BASE = import.meta.env.VITE_API_URL || 'https://medcare-1-wc3h.onrender.com/api'
const PATIENT_BASE = import.meta.env.VITE_API_URL || 'https://medcare-1-wc3h.onrender.com/api'

async function req(base, path, opts = {}) {
  const res = await fetch(`${base}${path}`, {
    headers: { 'Content-Type': 'application/json', ...opts.headers },
    ...opts,
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Request failed' }))
    throw new Error(err.detail || `HTTP ${res.status}`)
  }
  return res.json()
}

export const api = {
  getStats:       ()     => req(DOCTOR_BASE, '/stats'),
  getPatients:    ()     => req(DOCTOR_BASE, '/patients'),
  createPatient:  (d)    => req(DOCTOR_BASE, '/patients',           { method: 'POST', body: JSON.stringify(d) }),
  getCases:       ()     => req(DOCTOR_BASE, '/cases'),
  createCase:     (d)    => req(DOCTOR_BASE, '/cases',              { method: 'POST', body: JSON.stringify(d) }),
  getCase:        (id)   => req(DOCTOR_BASE, `/cases/${id}`),
  processCase:    (id)   => req(DOCTOR_BASE, `/cases/${id}/process`,  { method: 'POST' }),
  generatePlan:   (id)   => req(DOCTOR_BASE, `/cases/${id}/generate`, { method: 'POST' }),
  generatePlanGemini: (id) => req(DOCTOR_BASE, `/cases/${id}/generate-gemini`, { method: 'POST' }),
  getGeminiStatus: () => req(DOCTOR_BASE, '/gemini-status'),
  getCarePlan:    (id)   => req(DOCTOR_BASE, `/cases/${id}/plan`),
  approveCase:    (id,d) => req(DOCTOR_BASE, `/cases/${id}/approve`,  { method: 'PUT', body: JSON.stringify(d) }),
  getReviewQueue: ()     => req(DOCTOR_BASE, '/review'),
  getDiseases:    ()     => req(DOCTOR_BASE, '/kb/diseases'),

  getPatientsAll:      () => req(PATIENT_BASE, '/patients/all'),
  getPatientPlan:      (patientId) => req(PATIENT_BASE, `/patients/${patientId}/plan`),
  getPatientGamification:  (patientId) => req(PATIENT_BASE, `/patients/${patientId}/gamification`),
  savePatientGamification: (patientId, data) => req(PATIENT_BASE, `/patients/${patientId}/gamification`, {
    method: 'POST',
    body: JSON.stringify(data)
  }),
  login: (username_or_email, password) => req(DOCTOR_BASE, '/auth/login', {
    method: 'POST',
    body: JSON.stringify({ username_or_email, password })
  }),
  register: (payload) => req(DOCTOR_BASE, '/auth/register', {
    method: 'POST',
    body: JSON.stringify(payload)
  }),
}
