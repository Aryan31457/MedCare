import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../api/client.js'

const STATUS_META = {
  uploaded:        { label: 'Uploaded',      icon: '📄' },
  processing:      { label: 'Processing',    icon: '⚙️' },
  review_required: { label: 'Needs Review',  icon: '⚠️' },
  ready:           { label: 'Ready',         icon: '🔵' },
  approved:        { label: 'Approved',      icon: '✅' },
}

function StatCard({ value, label, icon, color }) {
  return (
    <div className="stat-card" style={{ '--accent-color': color }}>
      <div className="stat-icon">{icon}</div>
      <div className="stat-value">{value}</div>
      <div className="stat-label">{label}</div>
    </div>
  )
}

function Skeleton() {
  return (
    <div className="page-content" style={{ paddingTop: 32 }}>
      <div className="stats-grid" style={{ marginBottom: 28 }}>
        {[...Array(6)].map((_, i) => (
          <div key={i} className="skeleton" style={{ height: 110, borderRadius: 12 }} />
        ))}
      </div>
      <div className="skeleton" style={{ height: 420, borderRadius: 16 }} />
    </div>
  )
}

export default function Dashboard() {
  const [cases, setCases]   = useState([])
  const [stats, setStats]   = useState(null)
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    Promise.all([api.getCases(), api.getStats()])
      .then(([c, s]) => { setCases(c); setStats(s) })
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <Skeleton />

  return (
    <>
      <div className="topbar">
        <div>
          <div className="topbar-title">Dashboard</div>
          <div className="topbar-sub">Automatic Discharge Care Plan System — Prototype</div>
        </div>
        <div className="topbar-right">
          <button className="btn btn-primary" onClick={() => navigate('/cases/new')}>
            ➕ New Case
          </button>
        </div>
      </div>

      <div className="page-content">
        {/* Stats Row */}
        <div className="stats-grid">
          <StatCard value={stats?.total_cases ?? 0}      label="Total Cases"    icon="📋" color="#3b82f6" />
          <StatCard value={stats?.review_required ?? 0}  label="Needs Review"   icon="⚠️" color="#ef4444" />
          <StatCard value={stats?.approved ?? 0}         label="Approved"       icon="✅" color="#10b981" />
          <StatCard value={stats?.ready ?? 0}            label="Ready"          icon="🔵" color="#06b6d4" />
          <StatCard value={stats?.total_patients ?? 0}   label="Patients"       icon="👤" color="#8b5cf6" />
          <StatCard value={stats?.flags_pending ?? 0}    label="Flags Pending"  icon="🚩" color="#f59e0b" />
        </div>

        {/* Case Table */}
        <div className="card">
          <div className="card-header">
            <div>
              <div className="card-title">All Discharge Cases</div>
              <div className="card-subtitle">{cases.length} cases · click any row to open</div>
            </div>
            <button className="btn btn-ghost btn-sm" onClick={() => { setLoading(true); Promise.all([api.getCases(), api.getStats()]).then(([c,s])=>{ setCases(c); setStats(s) }).finally(()=>setLoading(false)) }}>
              🔄 Refresh
            </button>
          </div>

          {cases.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">🏥</div>
              <div className="empty-title">No cases yet</div>
              <div className="empty-sub">Create your first discharge case to get started</div>
              <button className="btn btn-primary" onClick={() => navigate('/cases/new')}>Create New Case</button>
            </div>
          ) : (
            <table className="case-table">
              <thead>
                <tr>
                  <th>Patient</th>
                  <th>Diagnoses</th>
                  <th>Status</th>
                  <th>Flags</th>
                  <th>Plan</th>
                  <th>Date</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {cases.map(c => {
                  const dest = c.has_care_plan ? `/cases/${c.id}/plan` : `/cases/${c.id}`
                  return (
                    <tr key={c.id} onClick={() => navigate(dest)}>
                      <td>
                        <div className="patient-name">{c.patient_name}</div>
                        <div className="patient-meta">{c.patient_age}y · {c.patient_id}</div>
                      </td>
                      <td>
                        <div className="diagnosis-tags">
                          {c.primary_diagnoses?.slice(0, 2).map(d => (
                            <span key={d} className="diag-tag">
                              {d.replace('Post-Myocardial Infarction (Post-PCI)', 'Post-MI')
                                .replace('Congestive Heart Failure (CHF)', 'CHF')
                                .replace('Enteric Fever (Typhoid)', 'Typhoid')
                                .replace('Hypertension (Primary)', 'HTN')
                                .replace('Chronic Kidney Disease Stage 3', 'CKD-3')
                                .replace('Type 2 Diabetes Mellitus', 'T2DM')}
                            </span>
                          ))}
                          {c.primary_diagnoses?.length > 2 && (
                            <span className="diag-tag">+{c.primary_diagnoses.length - 2}</span>
                          )}
                        </div>
                      </td>
                      <td>
                        <div className={`badge ${c.status}`}>
                          <span className="badge-dot" />
                          {STATUS_META[c.status]?.label || c.status}
                        </div>
                      </td>
                      <td>
                        <span className={`flag-count ${c.flag_count > 0 ? 'critical' : 'none'}`}>
                          {c.flag_count}
                        </span>
                      </td>
                      <td style={{ fontSize: '1.1rem' }}>{c.has_care_plan ? '✅' : '—'}</td>
                      <td>
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                          {new Date(c.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                        </span>
                      </td>
                      <td>
                        <button className="btn btn-ghost btn-sm" onClick={e => { e.stopPropagation(); navigate(dest) }}>
                          Open →
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Quick Info */}
        <div style={{ marginTop: 24, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div className="card">
            <div className="card-title" style={{ marginBottom: 12 }}>📖 How to Use</div>
            {[
              ['➕ New Case', 'Register patient + paste discharge text'],
              ['🔬 Process', 'Extract diseases, drugs, labs, allergies via NLP'],
              ['🤖 Generate', 'AI rule engine builds complete care plan'],
              ['👨‍⚕️ Review', 'Doctor reviews flags and approves plan'],
              ['📋 Share', 'Approved plan is ready for patient'],
            ].map(([step, desc]) => (
              <div key={step} className="info-row">
                <span className="info-key">{step}</span>
                <span className="info-val" style={{ fontSize: '0.82rem' }}>{desc}</span>
              </div>
            ))}
          </div>
          <div className="card">
            <div className="card-title" style={{ marginBottom: 12 }}>🧬 Knowledge Base</div>
            {[
              ['Diseases', '6 conditions (T2DM, HTN, CKD, Post-MI, Typhoid, CHF)'],
              ['Drugs', '13 medications with full interaction profiles'],
              ['Nutrition', '6 Indian meal plans (diabetic, cardiac, renal, typhoid)'],
              ['Labs', '8 lab tests with thresholds & implications'],
              ['Exercise', '6 exercise types with restriction matrix'],
              ['Age Groups', '6 profiles (pediatric → geriatric)'],
            ].map(([k, v]) => (
              <div key={k} className="info-row">
                <span className="info-key">{k}</span>
                <span className="info-val" style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>{v}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  )
}
