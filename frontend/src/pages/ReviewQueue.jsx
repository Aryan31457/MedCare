import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../api/client.js'

export default function ReviewQueue() {
  const [queue, setQueue]   = useState([])
  const [loading, setLoad]  = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    api.getReviewQueue().then(setQueue).finally(() => setLoad(false))
  }, [])

  const refresh = () => { setLoad(true); api.getReviewQueue().then(setQueue).finally(() => setLoad(false)) }

  if (loading) return <div className="page-content"><div className="skeleton" style={{height:400,borderRadius:16,marginTop:32}}/></div>

  return (
    <>
      <div className="topbar">
        <div>
          <div className="topbar-title">⚠️ Human Review Queue</div>
          <div className="topbar-sub">
            {queue.length === 0 ? 'All clear — no cases pending review' : `${queue.length} case(s) require physician review before approval`}
          </div>
        </div>
        <div className="topbar-right">
          <button className="btn btn-ghost btn-sm" onClick={refresh}>🔄 Refresh</button>
        </div>
      </div>

      <div className="page-content">
        {queue.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">✅</div>
            <div className="empty-title">No pending reviews</div>
            <div className="empty-sub">All care plans have been reviewed or are awaiting generation</div>
            <button className="btn btn-primary" onClick={() => navigate('/')}>← Back to Dashboard</button>
          </div>
        ) : (
          queue.map(c => {
            const allFlags = c.all_flags || []
            const crit = allFlags.filter(f => f.severity === 'critical')
            const high = allFlags.filter(f => f.severity === 'high')
            const med  = allFlags.filter(f => f.severity === 'medium')
            const dest = c.has_care_plan ? `/cases/${c.id}/plan` : `/cases/${c.id}`

            return (
              <div key={c.id} className={`review-card ${crit.length > 0 ? 'critical-case' : ''}`} onClick={() => navigate(dest)}>
                <div className="review-card-header">
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 6 }}>
                      <span style={{ fontWeight: 700, fontSize: '1.05rem' }}>{c.patient_name}</span>
                      <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>{c.patient_age}y</span>
                      <div className={`badge review_required`}><span className="badge-dot"/>Needs Review</div>
                    </div>
                    <div className="diagnosis-tags" style={{ marginBottom: 8 }}>
                      {c.primary_diagnoses?.map(d => (
                        <span key={d} className="diag-tag">
                          {d.replace('Post-Myocardial Infarction (Post-PCI)','Post-MI')
                            .replace('Congestive Heart Failure (CHF)','CHF')
                            .replace('Enteric Fever (Typhoid)','Typhoid')
                            .replace('Hypertension (Primary)','HTN')
                            .replace('Chronic Kidney Disease Stage 3','CKD-3')
                            .replace('Type 2 Diabetes Mellitus','T2DM')}
                        </span>
                      ))}
                    </div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                      Case ID: {c.id} · Processed: {c.processed_at ? new Date(c.processed_at).toLocaleString('en-IN', {day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'}) : '—'}
                    </div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8 }}>
                    <button
                      className={`btn ${crit.length > 0 ? 'btn-danger' : 'btn-primary'} btn-sm`}
                      onClick={e => { e.stopPropagation(); navigate(dest) }}
                    >
                      {c.has_care_plan ? '📋 Review Plan →' : '🔬 View Case →'}
                    </button>
                    {c.has_care_plan && (
                      <span style={{ fontSize: '0.72rem', color: 'var(--green)' }}>✅ Care plan generated</span>
                    )}
                  </div>
                </div>

                {/* Flag Summary Badges */}
                <div className="review-flags-summary">
                  {crit.length > 0 && (
                    <span className="badge" style={{ background:'rgba(239,68,68,0.15)',color:'#f87171',border:'1px solid rgba(239,68,68,0.3)' }}>
                      🔴 {crit.length} Critical
                    </span>
                  )}
                  {high.length > 0 && (
                    <span className="badge" style={{ background:'rgba(245,158,11,0.15)',color:'var(--amber)',border:'1px solid rgba(245,158,11,0.3)' }}>
                      🟠 {high.length} High
                    </span>
                  )}
                  {med.length > 0 && (
                    <span className="badge" style={{ background:'rgba(6,182,212,0.15)',color:'var(--cyan)',border:'1px solid rgba(6,182,212,0.3)' }}>
                      🔵 {med.length} Medium
                    </span>
                  )}
                  <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginLeft: 8 }}>
                    {allFlags.length} total flags
                  </span>
                </div>

                {/* Top 3 flags */}
                <div style={{ marginTop: 14 }}>
                  {allFlags.slice(0, 3).map((f, i) => (
                    <div key={i} className={`flag-card ${f.severity}`} style={{ marginBottom: 8 }}>
                      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
                        <div style={{ flex: 1 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                            <span className={`flag-severity ${f.severity}`}>{f.severity}</span>
                            <span className="flag-title" style={{ fontSize: '0.87rem' }}>{f.title}</span>
                          </div>
                          <div className="flag-message" style={{ fontSize: '0.8rem' }}>{f.message}</div>
                        </div>
                      </div>
                      <div className="flag-action" style={{ fontSize: '0.75rem', marginTop: 6 }}>
                        Required: {f.action_required}
                      </div>
                    </div>
                  ))}
                  {allFlags.length > 3 && (
                    <div style={{ textAlign: 'center', fontSize: '0.8rem', color: 'var(--accent-light)', padding: 8, cursor: 'pointer' }}
                      onClick={e => { e.stopPropagation(); navigate(dest) }}>
                      +{allFlags.length - 3} more flags — view full plan to see all
                    </div>
                  )}
                </div>
              </div>
            )
          })
        )}
      </div>
    </>
  )
}
