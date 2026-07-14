import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../api/client.js'
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Chip,
  Grid,
  Alert,
  IconButton,
  Paper
} from '@mui/material'
import {
  AlertTriangle,
  RefreshCw,
  CheckCircle,
  ArrowRight,
  ClipboardList,
  FileCheck
} from 'lucide-react'

export default function ReviewQueue() {
  const [queue, setQueue]   = useState([])
  const [loading, setLoad]  = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    api.getReviewQueue().then(setQueue).finally(() => setLoad(false))
  }, [])

  const refresh = () => { setLoad(true); api.getReviewQueue().then(setQueue).finally(() => setLoad(false)) }

  if (loading) return <div className="page-content"><div className="skeleton" style={{ height: 400, borderRadius: 16, marginTop: 32 }} /></div>

  return (
    <Box>
      {/* Topbar navigation */}
      <Box sx={{ 
        bgcolor: 'background.paper', 
        borderBottom: '1px solid #eee8e1', 
        p: '18px 32px', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between'
      }}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 800, color: 'primary.dark', letterSpacing: '-0.02em', display: 'flex', alignItems: 'center', gap: 1 }}>
            <AlertTriangle size={24} style={{ color: 'var(--red)' }} /> Review Queue
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.2 }}>
            {queue.length === 0 
              ? 'All clear — no patient plans pending clinician sign-off' 
              : `${queue.length} case(s) require clinical verification before release`}
          </Typography>
        </Box>
        <IconButton onClick={refresh} sx={{ border: '1px solid #eee8e1', borderRadius: 2 }}>
          <RefreshCw size={16} />
        </IconButton>
      </Box>

      <Box sx={{ p: 4 }}>
        {queue.length === 0 ? (
          <Box sx={{ p: 6, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
            <Box sx={{ color: 'success.main', mb: 2 }}><FileCheck size={48} strokeWidth={1.5} /></Box>
            <Typography variant="h6" sx={{ fontWeight: 700, color: 'text.primary', mb: 1 }}>All plans signed off</Typography>
            <Typography variant="body2" sx={{ color: 'text.disabled', mb: 3, maxWidth: 450, textAlign: 'center' }}>
              There are no pending care plans in the review queue. All plans have been approved and synced to patient portals.
            </Typography>
            <Button variant="contained" onClick={() => navigate('/')}>Back to Dashboard</Button>
          </Box>
        ) : (
          queue.map(c => {
            const allFlags = c.all_flags || []
            const crit = allFlags.filter(f => f.severity === 'critical')
            const high = allFlags.filter(f => f.severity === 'high')
            const med  = allFlags.filter(f => f.severity === 'medium')
            const dest = c.has_care_plan ? `/cases/${c.id}/plan` : `/cases/${c.id}`

            return (
              <Card key={c.id} sx={{ mb: 3, cursor: 'pointer' }} onClick={() => navigate(dest)}>
                <CardContent sx={{ p: 3, '&:last-child': { pb: 3 } }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', pb: 2, borderBottom: '1px dashed #eee8e1' }}>
                    <Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
                        <Typography variant="subtitle1" sx={{ fontWeight: 700, color: 'primary.dark' }}>
                          {c.patient_name}
                        </Typography>
                        <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                          {c.patient_age}y · ID: {c.patient_id}
                        </Typography>
                        <Chip size="small" label="Audit Required" color="warning" sx={{ height: 20, fontSize: '0.65rem', fontWeight: 800 }} />
                      </Box>
                      <Box sx={{ display: 'flex', gap: 0.8, flexWrap: 'wrap' }}>
                        {c.primary_diagnoses?.map(d => (
                          <Chip 
                            key={d} 
                            size="small" 
                            label={d.replace('Post-Myocardial Infarction (Post-PCI)','Post-MI')
                              .replace('Congestive Heart Failure (CHF)','CHF')
                              .replace('Enteric Fever (Typhoid)','Typhoid')
                              .replace('Hypertension (Primary)','HTN')
                              .replace('Chronic Kidney Disease Stage 3','CKD-3')
                              .replace('Type 2 Diabetes Mellitus','T2DM')}
                          />
                        ))}
                      </Box>
                    </Box>
                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 1 }}>
                      <Button
                        variant="contained"
                        size="small"
                        onClick={e => { e.stopPropagation(); navigate(dest) }}
                        endIcon={<ArrowRight size={14} />}
                      >
                        {c.has_care_plan ? 'Audit Care Plan' : 'Execute Extraction'}
                      </Button>
                      {c.has_care_plan && (
                        <Typography variant="caption" sx={{ color: 'success.main', fontWeight: 700 }}>Plan Compiled</Typography>
                      )}
                    </Box>
                  </Box>

                  {/* Flag counters */}
                  <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap', mt: 2 }}>
                    {crit.length > 0 && (
                      <Chip label={`${crit.length} Critical`} size="small" color="error" sx={{ fontWeight: 800 }} />
                    )}
                    {high.length > 0 && (
                      <Chip label={`${high.length} High`} size="small" color="warning" sx={{ fontWeight: 800 }} />
                    )}
                    {med.length > 0 && (
                      <Chip label={`${med.length} Medium`} size="small" color="info" sx={{ fontWeight: 800 }} />
                    )}
                    <Typography variant="caption" sx={{ color: 'text.secondary', display: 'flex', alignItems: 'center' }}>
                      ({allFlags.length} total verification warnings)
                    </Typography>
                  </Box>

                  {/* Top 3 flags list preview */}
                  <Box sx={{ mt: 2 }}>
                    {allFlags.slice(0, 3).map((f, i) => (
                      <Alert 
                        key={i} 
                        severity={f.severity === 'critical' ? 'error' : f.severity === 'high' ? 'warning' : 'info'}
                        sx={{ mb: 1, py: 0.5, '&:last-child': { mb: 0 } }}
                      >
                        <Typography variant="caption" sx={{ fontWeight: 700, display: 'block' }}>{f.title}</Typography>
                        <Typography variant="caption" sx={{ display: 'block', color: 'text.secondary' }}>{f.message}</Typography>
                      </Alert>
                    ))}
                    {allFlags.length > 3 && (
                      <Typography 
                        variant="caption" 
                        sx={{ display: 'block', color: 'primary.main', fontWeight: 700, textAlign: 'center', mt: 1, cursor: 'pointer' }}
                        onClick={e => { e.stopPropagation(); navigate(dest) }}
                      >
                        +{allFlags.length - 3} more flags pending verification — open folder to review all
                      </Typography>
                    )}
                  </Box>
                </CardContent>
              </Card>
            )
          })
        )}
      </Box>
    </Box>
  )
}
