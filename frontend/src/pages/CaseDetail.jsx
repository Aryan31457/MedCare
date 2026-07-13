import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { api } from '../api/client.js'

const STEPS = ['Document Uploaded', 'Entities Extracted', 'Rules Applied', 'Plan Generated & Approved']
const STEP_FOR_STATUS = { uploaded: 1, processing: 2, review_required: 3, ready: 3, approved: 4 }

export default function CaseDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [data, setData]         = useState(null)
  const [loading, setLoading]   = useState(true)
  const [processing, setProc]   = useState(false)
  const [generating, setGen]    = useState(false)
  const [error, setError]       = useState(null)

  const load = () => api.getCase(id).then(setData).catch(e => setError(e.message)).finally(() => setLoading(false))

  useEffect(() => { load() }, [id])

  const handleProcess = async () => {
    setProc(true); setError(null)
    try { await api.processCase(id); setLoading(true); await load() }
    catch (e) { setError(e.message) }
    finally { setProc(false) }
  }

  const handleGenerate = async () => {
    setGen(true); setError(null)
    try { await api.generatePlan(id); navigate(`/cases/${id}/plan`) }
    catch (e) { setError(e.message) }
    finally { setGen(false) }
  }

  if (loading) return <div className="page-content"><div className="skeleton" style={{ height: 500, borderRadius: 16, marginTop: 32 }} /></div>
  if (!data)   return <div className="page-content"><div className="alert danger"><span className="alert-icon">❌</span><div>Case not found</div></div></div>

  const { patient, extracted_entities: ent, resolved_rules: rules, status, human_review_flags: flags = [] } = data
  const isProcessed = !!ent
  const step = STEP_FOR_STATUS[status] || 1

  return (
    <>
      <div className="topbar">
        <div>
          <div className="topbar-title">{patient?.name || 'Case Detail'}</div>
          <div className="topbar-sub">Case {id} · {patient?.age}y {patient?.sex}</div>
        </div>
        <div className="topbar-right page-actions">
          {!isProcessed && (
            <button className="btn btn-primary" onClick={handleProcess} disabled={processing}>
              {processing ? <><span className="spinner" /> Extracting…</> : '🔬 Run NLP & Rule Engine'}
            </button>
          )}
          {isProcessed && !data.has_care_plan && (
            <button className="btn btn-success" onClick={handleGenerate} disabled={generating}>
              {generating ? <><span className="spinner" /> Generating…</> : '🤖 Generate Care Plan'}
            </button>
          )}
          {data.has_care_plan && (
            <button className="btn btn-primary" onClick={() => navigate(`/cases/${id}/plan`)}>
              📋 View Care Plan →
            </button>
          )}
          <button className="btn btn-ghost btn-sm" onClick={() => navigate('/')}>← Dashboard</button>
        </div>
      </div>

      <div className="page-content">
        {error && (
          <div className="alert danger" style={{ marginBottom: 20 }}>
            <span className="alert-icon">❌</span>
            <div className="alert-content"><div className="alert-title">{error}</div></div>
          </div>
        )}

        {/* Pipeline Progress */}
        <div className="card" style={{ marginBottom: 20 }}>
          <div className="card-subtitle" style={{ marginBottom: 16 }}>Processing Pipeline</div>
          <div className="pipeline-steps">
            {STEPS.map((label, i) => (
              <div key={label} className="pipeline-step">
                <div className={`step-circle ${step > i+1 ? 'done' : step === i+1 ? 'active' : 'pending'}`}>
                  {step > i+1 ? '✓' : i+1}
                </div>
                <div className="step-label">{label}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="two-col" style={{ marginBottom: 20 }}>
          {/* Patient Card */}
          <div className="card">
            <div className="card-header">
              <div className="card-title">👤 Patient Profile</div>
              <div className={`badge ${status}`}><span className="badge-dot" />{status.replace(/_/g,' ')}</div>
            </div>
            {[
              ['Name', patient?.name],
              ['Age / Sex', `${patient?.age}y / ${patient?.sex}`],
              ['Weight', patient?.weight_kg ? `${patient.weight_kg} kg` : '—'],
              ['Blood Group', patient?.blood_group || '—'],
              ['Contact', patient?.contact || '—'],
            ].map(([k, v]) => (
              <div key={k} className="info-row">
                <span className="info-key">{k}</span>
                <span className="info-val">{v}</span>
              </div>
            ))}
            <div className="info-row">
              <span className="info-key">Allergies</span>
              <span className="info-val" style={{ color: patient?.allergies?.length ? '#fca5a5' : 'var(--green)', fontWeight: 600 }}>
                {patient?.allergies?.length ? patient.allergies.join(', ').toUpperCase() : '✅ NKDA'}
              </span>
            </div>
          </div>

          {/* Flags / Document Preview */}
          {flags.length > 0 ? (
            <div className="card">
              <div className="card-header">
                <div className="card-title">🚩 Review Flags</div>
                <span className="flag-count critical">{flags.length}</span>
              </div>
              <div style={{ maxHeight: 280, overflowY: 'auto' }}>
                {flags.map((f, i) => (
                  <div key={i} className={`flag-card ${f.severity}`}>
                    <span className={`flag-severity ${f.severity}`}>{f.severity}</span>
                    <div className="flag-title">{f.title}</div>
                    <div className="flag-message">{f.message}</div>
                    <div className="flag-action">→ {f.action_required}</div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="card">
              <div className="card-title" style={{ marginBottom: 12 }}>📄 Discharge Document Preview</div>
              <pre style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontFamily: 'Courier New, monospace', maxHeight: 260, overflowY: 'auto', lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>
                {data.discharge_text?.slice(0, 700)}{data.discharge_text?.length > 700 ? '\n...' : ''}
              </pre>
            </div>
          )}
        </div>

        {/* Extracted Entities */}
        {isProcessed && ent && (
          <div className="card">
            <div className="card-header">
              <div className="card-title">🔬 Extracted Clinical Entities</div>
              <div className="card-subtitle">
                {ent.diseases?.length} diseases · {ent.drugs?.length} drugs · {ent.lab_values?.length} labs · {ent.allergies?.length} allergies
              </div>
            </div>

            {/* Diseases */}
            {ent.diseases?.length > 0 && (
              <div className="entity-section">
                <div className="entity-section-title">🏥 Diagnoses</div>
                <div className="entity-tags">
                  {ent.diseases.map(d => (
                    <span key={d.code} className="entity-tag disease">
                      🔵 {d.name}
                      <span style={{ fontSize: '0.68rem', opacity: 0.6 }}> · {d.icd10}</span>
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Drugs */}
            {ent.drugs?.length > 0 && (
              <div className="entity-section">
                <div className="entity-section-title">💊 Medications</div>
                <div className="entity-tags">
                  {ent.drugs.map(d => (
                    <span key={d.code} className="entity-tag drug">
                      💊 {d.name}
                      {d.dose && <span style={{ fontSize: '0.7rem', opacity: 0.7 }}> {d.dose}</span>}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Labs */}
            {ent.lab_values?.length > 0 && (
              <div className="entity-section">
                <div className="entity-section-title">🧪 Lab Values</div>
                <div className="entity-tags">
                  {ent.lab_values.map(l => (
                    <span key={l.test} className="entity-tag lab"
                      style={l.is_critical ? { borderColor:'rgba(239,68,68,0.45)', background:'rgba(239,68,68,0.08)' } : {}}>
                      🧪 {l.test}: <strong style={{ marginLeft: 4 }}>{l.value} {l.unit}</strong>
                      {l.is_critical && <span className="crit-badge">CRITICAL</span>}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Allergies */}
            {ent.allergies?.length > 0 && (
              <div className="entity-section">
                <div className="entity-section-title">⛔ Extracted Allergies</div>
                <div className="entity-tags">
                  {ent.allergies.map(a => (
                    <span key={a.allergen} className="entity-tag allergy">⛔ {a.allergen.toUpperCase()}</span>
                  ))}
                </div>
              </div>
            )}

            {/* Vitals */}
            {ent.vitals && Object.keys(ent.vitals).length > 0 && (
              <div className="entity-section">
                <div className="entity-section-title">❤️ Vitals Extracted</div>
                <div className="entity-tags">
                  {Object.entries(ent.vitals).map(([k, v]) => (
                    <span key={k} className="entity-tag vital">
                      {k.replace(/_/g,' ').replace(/\b\w/g,c=>c.toUpperCase())}: {v}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Allergy Alerts */}
            {rules?.allergy_alerts?.length > 0 && (
              <div style={{ marginTop: 20 }}>
                <div className="entity-section-title" style={{ color: '#fca5a5' }}>⛔ Allergy Alerts from Rule Engine</div>
                {rules.allergy_alerts.map((a, i) => (
                  <div key={i} className="flag-card critical">
                    <span className="flag-severity critical">CRITICAL ALLERGY</span>
                    <div className="flag-title">{a.message}</div>
                    {a.alternatives?.length > 0 && (
                      <div className="flag-action">Suggested alternatives: {a.alternatives.join(', ')}</div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Disease Conflicts */}
            {rules?.conflicts?.length > 0 && (
              <div style={{ marginTop: 20 }}>
                <div className="entity-section-title" style={{ color: 'var(--amber)' }}>⚡ Disease Conflicts Detected</div>
                {rules.conflicts.map((c, i) => (
                  <div key={i} className={`flag-card ${c.severity}`}>
                    <span className={`flag-severity ${c.severity}`}>{c.type.replace('_',' ')}</span>
                    <div className="flag-title">{c.disease1} + {c.disease2}</div>
                    <div className="flag-message">{c.message}</div>
                  </div>
                ))}
              </div>
            )}

            {/* Age Adjustments */}
            {rules?.age_adjustments?.length > 0 && (
              <div style={{ marginTop: 20 }}>
                <div className="entity-section-title">👴 Age-Adjusted Rules ({rules.age_group})</div>
                {rules.age_adjustments.map((a, i) => (
                  <div key={i} className="do-item" style={{ marginBottom: 6 }}>
                    <span className="icon">→</span> {a}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Action if not processed */}
        {!isProcessed && (
          <div className="card" style={{ marginTop: 20, textAlign: 'center', padding: 40 }}>
            <div style={{ fontSize: 2.5 + 'rem', marginBottom: 16 }}>🔬</div>
            <div style={{ fontWeight: 600, marginBottom: 8 }}>Ready to Process</div>
            <div style={{ color: 'var(--text-muted)', marginBottom: 24, fontSize: '0.88rem' }}>
              Click "Run NLP & Rule Engine" to extract entities from the discharge document and apply medical rules.
            </div>
            <button className="btn btn-primary btn-lg" onClick={handleProcess} disabled={processing}>
              {processing ? <><span className="spinner" /> Extracting Entities…</> : '🔬 Run NLP & Rule Engine'}
            </button>
          </div>
        )}
      </div>
    </>
  )
}
