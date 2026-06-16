const BASE = 'http://localhost:8000/api'

async function req(path, opts = {}) {
  const res = await fetch(`${BASE}${path}`, {
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
  getStats:       ()     => req('/stats'),
  getPatients:    ()     => req('/patients'),
  createPatient:  (d)    => req('/patients',           { method: 'POST', body: JSON.stringify(d) }),
  getCases:       ()     => req('/cases'),
  createCase:     (d)    => req('/cases',              { method: 'POST', body: JSON.stringify(d) }),
  getCase:        (id)   => req(`/cases/${id}`),
  processCase:    (id)   => req(`/cases/${id}/process`,  { method: 'POST' }),
  generatePlan:   (id)   => req(`/cases/${id}/generate`, { method: 'POST' }),
  getCarePlan:    (id)   => req(`/cases/${id}/plan`),
  approveCase:    (id,d) => req(`/cases/${id}/approve`,  { method: 'PUT', body: JSON.stringify(d) }),
  getReviewQueue: ()     => req('/review'),
  getDiseases:    ()     => req('/kb/diseases'),
}
