import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { api } from '../api/client.js'

const TABS = [
  { id:'diet',        label:'🥗 Diet Plan' },
  { id:'exercise',    label:'🏃 Exercise' },
  { id:'medications', label:'💊 Medications' },
  { id:'dosdonts',    label:"✅ Do's & Don'ts" },
  { id:'schedule',    label:'📅 Daily Schedule' },
  { id:'timeline',    label:'📈 Timeline' },
  { id:'redflags',    label:'🚨 Red Flags' },
  { id:'note',        label:"📋 Doctor's Note" },
]

export default function CarePlanView() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [plan, setPlan]     = useState(null)
  const [loading, setLoad]  = useState(true)
  const [tab, setTab]       = useState('diet')
  const [modal, setModal]   = useState(false)
  const [approver, setApprover] = useState('')
  const [approving, setApproving] = useState(false)
  const [error, setError]   = useState(null)

  useEffect(() => {
    api.getCarePlan(id)
      .then(setPlan)
      .catch(e => setError(e.message))
      .finally(() => setLoad(false))
  }, [id])

  const approve = async () => {
    if (!approver.trim()) return
    setApproving(true)
    try {
      await api.approveCase(id, { approved_by: approver })
      const updated = await api.getCarePlan(id)
      setPlan(updated); setModal(false)
    } catch (e) { setError(e.message) }
    finally { setApproving(false) }
  }

  if (loading) return <div className="page-content"><div className="skeleton" style={{ height:500, borderRadius:16, marginTop:32 }} /></div>
  if (!plan)   return <div className="page-content"><div className="alert danger"><span className="alert-icon">❌</span><div>{error || 'Care plan not found.'}</div></div></div>

  const d = plan.plan_data
  const flags = d.human_review_flags || []
  const crit  = flags.filter(f => f.severity==='critical')
  const high  = flags.filter(f => f.severity==='high')
  const confPct = Math.round((d.confidence_score||0)*100)

  return (
    <>
      <div className="topbar">
        <div>
          <div className="topbar-title">📋 {d.patient_name} — Care Plan</div>
          <div className="topbar-sub">{d.primary_diagnoses?.join(' · ')} · {d.age_group} · {confPct}% confidence</div>
        </div>
        <div className="topbar-right page-actions">
          {plan.approved
            ? <div className="badge approved"><span className="badge-dot"/>Approved · {plan.approved_by}</div>
            : <button className="btn btn-success" onClick={()=>setModal(true)}>✅ Approve Plan</button>
          }
          <button className="btn btn-ghost btn-sm" onClick={()=>navigate(`/cases/${id}`)}>← Case</button>
          <button className="btn btn-ghost btn-sm" onClick={()=>navigate('/')}>Dashboard</button>
        </div>
      </div>

      <div className="page-content">
        {error && <div className="alert danger" style={{marginBottom:16}}><span className="alert-icon">❌</span>{error}</div>}

        {/* Status bar */}
        {flags.length > 0 && !plan.approved && (
          <div className={`alert ${crit.length>0?'danger':'warning'}`} style={{marginBottom:20}}>
            <span className="alert-icon">{crit.length>0?'🔴':'🟠'}</span>
            <div className="alert-content">
              <div className="alert-title">
                {crit.length>0 ? `${crit.length} Critical` : ''}{crit.length>0 && high.length>0?' + ':''}{high.length>0?`${high.length} High Priority`:''} Flags Require Review Before Approval
              </div>
              <div style={{fontSize:'0.8rem',color:'var(--text-muted)',marginTop:4}}>
                {flags.slice(0,2).map(f=>f.title).join(' · ')}{flags.length>2?` +${flags.length-2} more`:''}
              </div>
            </div>
            <button className="btn btn-ghost btn-sm" onClick={()=>navigate('/review')}>Review Queue →</button>
          </div>
        )}
        {plan.approved && (
          <div className="alert success" style={{marginBottom:20}}>
            <span className="alert-icon">✅</span>
            <div className="alert-content">
              <div className="alert-title">Approved by {plan.approved_by}</div>
              <div style={{fontSize:'0.82rem'}}>{plan.approved_at ? new Date(plan.approved_at).toLocaleString('en-IN') : ''}</div>
            </div>
          </div>
        )}

        {/* Confidence + flag counts */}
        <div className="card" style={{marginBottom:20}}>
          <div style={{display:'flex',alignItems:'center',gap:20}}>
            <div style={{flex:1}}>
              <div style={{fontSize:'0.72rem',color:'var(--text-muted)',marginBottom:6,textTransform:'uppercase',letterSpacing:'0.08em'}}>AI Confidence Score</div>
              <div className="confidence-bar"><div className="confidence-fill" style={{width:`${confPct}%`}}/></div>
              <div style={{fontSize:'0.8rem',color:'var(--text-secondary)',marginTop:5}}>
                {confPct}% — {d.primary_diagnoses?.length} diagnoses · {d.medications?.length||0} meds · {flags.length} flags
              </div>
            </div>
            {[['🔴',crit.length,'Critical','var(--red)'],['🟠',high.length,'High','var(--amber)'],['🟡',flags.filter(f=>f.severity==='medium').length,'Medium','var(--cyan)']].map(([icon,count,label,color])=>(
              <div key={label} style={{textAlign:'center',minWidth:60}}>
                <div style={{fontSize:'1.8rem',fontWeight:800,color:count>0?color:'var(--text-muted)'}}>{count}</div>
                <div style={{fontSize:'0.68rem',color:'var(--text-muted)',textTransform:'uppercase'}}>{label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Tabs */}
        <div className="cp-tabs">
          {TABS.map(t=>(
            <button key={t.id} className={`cp-tab ${tab===t.id?'active':''}`} onClick={()=>setTab(t.id)}>
              {t.label}
            </button>
          ))}
        </div>

        <div className="cp-section">
          {tab==='diet'        && <DietTab        diet={d.diet_plan}/>}
          {tab==='exercise'    && <ExerciseTab    ex={d.exercise_plan}/>}
          {tab==='medications' && <MedsTab        meds={d.medications}/>}
          {tab==='dosdonts'    && <DosDontsTab    dd={d.dos_and_donts}/>}
          {tab==='schedule'    && <ScheduleTab    sched={d.daily_schedule}/>}
          {tab==='timeline'    && <TimelineTab    tl={d.recovery_timeline}/>}
          {tab==='redflags'    && <RedFlagsTab    rf={d.red_flag_symptoms}/>}
          {tab==='note'        && <NoteTab        note={d.doctors_note} flags={flags} mon={d.monitoring_schedule}/>}
        </div>
      </div>

      {/* Approve Modal */}
      {modal && (
        <div className="modal-overlay" onClick={()=>setModal(false)}>
          <div className="modal" onClick={e=>e.stopPropagation()}>
            <div className="modal-title">✅ Approve Care Plan</div>
            <div className="modal-sub">
              {flags.length>0
                ? `This plan has ${flags.length} flag(s). By approving, you confirm you have reviewed all clinical flags.`
                : 'Confirm physician approval to share this care plan with the patient.'}
            </div>
            {crit.length>0 && (
              <div className="alert danger" style={{marginBottom:16}}>
                <span className="alert-icon">⚠️</span>
                <div className="alert-content">
                  <div className="alert-title">{crit.length} critical flag(s) present — ensure specialist review is completed.</div>
                </div>
              </div>
            )}
            <div className="form-group">
              <label className="form-label">Physician Name & Registration *</label>
              <input className="form-input" placeholder="Dr. Anil Sharma, MD — Reg# MCI-12345" value={approver} onChange={e=>setApprover(e.target.value)} />
            </div>
            <div className="modal-actions">
              <button className="btn btn-ghost" onClick={()=>setModal(false)}>Cancel</button>
              <button className="btn btn-success" onClick={approve} disabled={!approver.trim()||approving}>
                {approving ? <><span className="spinner"/>Approving…</> : '✅ Confirm Approval'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

/* ── Tab Components ────────────────────────────────── */

function InfoPill({label,value}){
  if(!value) return null
  return(
    <div style={{background:'var(--bg-surface)',border:'1px solid var(--border)',borderRadius:8,padding:'10px 14px',minWidth:160}}>
      <div style={{fontSize:'0.68rem',color:'var(--text-muted)',textTransform:'uppercase',letterSpacing:'0.08em'}}>{label}</div>
      <div style={{fontSize:'0.88rem',fontWeight:600,color:'var(--accent-light)',marginTop:3}}>{value}</div>
    </div>
  )
}

function DietTab({diet}){
  if(!diet) return null
  return(
    <div className="card">
      <h3 style={{marginBottom:6}}>{diet.plan_name}</h3>
      <p style={{marginBottom:20}}>{diet.overview}</p>
      <div style={{display:'flex',gap:12,flexWrap:'wrap',marginBottom:24}}>
        <InfoPill label="Caloric Target" value={diet.caloric_target}/>
        <InfoPill label="Protein Target" value={diet.protein_target}/>
        <InfoPill label="Sodium Limit"   value={diet.sodium_limit}/>
        <InfoPill label="Fluid Limit"    value={diet.fluid_limit}/>
      </div>
      <div className="meal-grid">
        {[['☀️ Breakfast',diet.breakfast],['🌤 Lunch',diet.lunch],['🌙 Dinner',diet.dinner],['🍵 Snacks',diet.snacks]].map(([t,items])=>(
          <div key={t} className="meal-card">
            <div className="meal-time">{t}</div>
            <ul className="meal-options">{(items||[]).map((m,i)=><li key={i}>{m}</li>)}</ul>
          </div>
        ))}
      </div>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:20,marginTop:20}}>
        <div>
          <div className="entity-section-title" style={{marginBottom:10}}>✅ Recommended Foods</div>
          <div className="food-list">{(diet.foods_recommended||[]).map((f,i)=><span key={i} className="food-tag-good">{f}</span>)}</div>
        </div>
        <div>
          <div className="entity-section-title" style={{marginBottom:10}}>⛔ Strictly Restricted</div>
          <div className="food-list">{(diet.foods_strictly_restricted||[]).map((f,i)=><span key={i} className="food-tag-bad">{f}</span>)}</div>
        </div>
      </div>
      {diet.lab_based_notes?.length>0 && (
        <div style={{marginTop:20}}>
          <div className="entity-section-title" style={{marginBottom:8}}>🧪 Lab-Based Adjustments</div>
          {diet.lab_based_notes.map((n,i)=><div key={i} className="flag-card medium" style={{marginBottom:8}}><div className="flag-message">{n}</div></div>)}
        </div>
      )}
      {diet.meal_timing_guidance && (
        <div className="alert info" style={{marginTop:16}}>
          <span className="alert-icon">⏰</span>
          <div className="alert-content"><div className="alert-title">Meal Timing</div>{diet.meal_timing_guidance}</div>
        </div>
      )}
    </div>
  )
}

function ExerciseTab({ex}){
  if(!ex) return null
  const intensityClass = s=>(s||'').toLowerCase().replace(/[^a-z]/g,'-').replace(/--+/g,'-')
  return(
    <div className="card">
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:20}}>
        <div>
          <h3>{ex.current_phase}</h3>
          {ex.absolute_exercise_restriction && (
            <div className="alert danger" style={{marginTop:10,display:'inline-flex'}}>
              <span className="alert-icon">⛔</span>
              <div className="alert-content">{ex.restriction_reason}</div>
            </div>
          )}
        </div>
      </div>
      <div className="phase-grid">
        {[['Phase 1 — Immediate',ex.phase1],['Phase 2 — Active Recovery',ex.phase2],['Phase 3 — Rehabilitation',ex.phase3]].map(([label,p])=>p&&(
          <div key={label} className="phase-card">
            <div className="phase-label">{label}</div>
            <div className="phase-type">{p.type}</div>
            <div className="phase-duration">⏱ {p.duration}</div>
            <span className={`phase-intensity ${intensityClass(p.intensity)}`}>{p.intensity}</span>
            {p.precautions&&<div style={{fontSize:'0.78rem',color:'var(--text-muted)',marginTop:10}}>⚠️ {p.precautions}</div>}
          </div>
        ))}
      </div>
      {ex.contraindications?.length>0&&(
        <div style={{marginTop:20}}>
          <div className="entity-section-title" style={{marginBottom:10}}>⛔ Contraindications</div>
          {ex.contraindications.map((c,i)=><div key={i} className="dont-item"><span className="icon">⛔</span>{c}</div>)}
        </div>
      )}
      {ex.pre_exercise_checklist?.length>0&&(
        <div style={{marginTop:20}}>
          <div className="entity-section-title" style={{marginBottom:10}}>✅ Pre-Exercise Checklist</div>
          {ex.pre_exercise_checklist.map((c,i)=><div key={i} className="do-item"><span className="icon">✓</span>{c}</div>)}
        </div>
      )}
    </div>
  )
}

function MedsTab({meds}){
  if(!meds?.length) return <div className="card"><div className="empty-state"><div className="empty-icon">💊</div><div className="empty-title">No medications</div></div></div>
  return(
    <div className="card">
      <div style={{marginBottom:20}}>
        <h3>{meds.length} Medications Prescribed</h3>
        <p>Follow timing and food instructions exactly as listed below.</p>
      </div>
      <div className="med-list">
        {meds.map((m,i)=>(
          <div key={i} className={`med-card ${m.allergy_alert?'has-alert':''}`}>
            <div>
              {m.allergy_alert&&<div style={{fontSize:'0.68rem',fontWeight:700,color:'var(--red)',textTransform:'uppercase',marginBottom:4}}>⛔ ALLERGY ALERT</div>}
              <div className="med-name">{m.name}</div>
              <div className="med-class">{m.class}</div>
              <div className="med-dose">💊 {m.dose||'As prescribed'} — {m.frequency||'As directed'}</div>
              <div className="med-timing">⏰ {m.timing}</div>
              {m.allergy_message&&<div className="med-alert">{m.allergy_message}</div>}
              {m.food_interactions?.length>0&&<div className="med-interaction">⚠️ {m.food_interactions.join('; ')}</div>}
              {m.important_notes?.length>0&&(
                <ul style={{marginTop:8,paddingLeft:16}}>
                  {m.important_notes.map((n,j)=><li key={j} style={{fontSize:'0.78rem',color:'var(--text-muted)',marginBottom:2}}>{n}</li>)}
                </ul>
              )}
            </div>
            <div style={{borderTop:'1px solid var(--border)', paddingTop:12, marginTop:4}}>
              <div style={{fontSize:'0.68rem',color:'var(--text-muted)',marginBottom:6,textTransform:'uppercase'}}>Watch For</div>
              <div style={{display:'flex', flexWrap:'wrap', gap:6}}>
                {m.side_effects_to_watch?.slice(0,3).map((s,j)=>(
                  <div key={j} style={{fontSize:'0.72rem',color:'var(--amber)',background:'rgba(245,158,11,0.08)',padding:'4px 8px',borderRadius:4}}>{s}</div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function DosDontsTab({dd}){
  if(!dd) return null
  return(
    <div className="card">
      <div className="dos-donts-grid">
        <div>
          <div className="section-header"><span className="section-icon">✅</span><h3>Do's</h3></div>
          <div className="dos-list">{(dd.dos||[]).map((item,i)=><div key={i} className="do-item"><span className="icon">✓</span>{item}</div>)}</div>
        </div>
        <div>
          <div className="section-header"><span className="section-icon">⛔</span><h3>Don'ts</h3></div>
          <div className="donts-list">{(dd.donts||[]).map((item,i)=><div key={i} className="dont-item"><span className="icon">✗</span>{item}</div>)}</div>
        </div>
      </div>
    </div>
  )
}

function ScheduleTab({sched}){
  if(!sched?.length) return null
  const icons={medication:'💊',meal:'🍽️',exercise:'🏃',monitoring:'📊',rest:'😴'}
  return(
    <div className="card">
      <h3 style={{marginBottom:16}}>Recommended Daily Schedule</h3>
      <div className="schedule-list">
        {sched.map((s,i)=>(
          <div key={i} className="schedule-item">
            <div className="schedule-time">{s.time}</div>
            <div>
              <div className="schedule-activity">{s.activity}</div>
              <div className="schedule-cat">
                <span className={`cat-tag ${s.category}`}>{icons[s.category]||'•'} {s.category}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function TimelineTab({tl}){
  if(!tl) return null
  const entries=Object.entries(tl)
  if(!entries.length) return <div className="card"><div className="empty-state"><div className="empty-icon">📈</div><div className="empty-title">No timeline data</div></div></div>
  return(
    <div className="card">
      <h3 style={{marginBottom:20}}>Recovery Milestones</h3>
      <div className="timeline-list">
        {entries.map(([period,milestones],i)=>(
          <div key={i} className="timeline-item">
            <div className="timeline-period">{period}</div>
            <div className="timeline-milestones">
              {(Array.isArray(milestones)?milestones:[milestones]).map((m,j)=>(
                <div key={j} className="timeline-milestone">{m}</div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function RedFlagsTab({rf}){
  if(!rf?.length) return null
  return(
    <div className="card">
      <div className="alert danger" style={{marginBottom:20}}>
        <span className="alert-icon">🚨</span>
        <div className="alert-content">
          <div className="alert-title">Seek Emergency Help Immediately for Any of These Symptoms</div>
          <div>Call 108 / 112 or go to the nearest Emergency Department without delay</div>
        </div>
      </div>
      <div className="red-flag-grid">
        {rf.map((f,i)=>(
          <div key={i} className="red-flag-card">
            <div className="red-flag-symptom">⚠️ {f.symptom}</div>
            <div className="red-flag-condition">Condition: {f.related_condition}</div>
            <div className="red-flag-action">{f.action}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

function NoteTab({note,flags,mon}){
  return(
    <div>
      {flags?.length>0&&(
        <div className="card" style={{marginBottom:20}}>
          <h3 style={{marginBottom:16}}>🚩 All Review Flags ({flags.length})</h3>
          {flags.map((f,i)=>(
            <div key={i} className={`flag-card ${f.severity}`}>
              <span className={`flag-severity ${f.severity}`}>{f.severity}</span>
              <div className="flag-title">{f.title}</div>
              <div className="flag-message">{f.message}</div>
              <div className="flag-action">→ {f.action_required}</div>
            </div>
          ))}
        </div>
      )}
      {mon&&Object.keys(mon).length>0&&(
        <div className="card" style={{marginBottom:20}}>
          <h3 style={{marginBottom:16}}>📅 Follow-Up Monitoring Schedule</h3>
          <div className="monitoring-grid">
            {Object.entries(mon).map(([test,freq])=>(
              <div key={test} className="monitoring-card">
                <div className="monitoring-test">{test}</div>
                <div className="monitoring-freq">🕐 {freq}</div>
              </div>
            ))}
          </div>
        </div>
      )}
      <div className="card">
        <h3 style={{marginBottom:16}}>📋 Physician's Review Note</h3>
        <pre className="doctors-note-pre">{note}</pre>
      </div>
    </div>
  )
}
