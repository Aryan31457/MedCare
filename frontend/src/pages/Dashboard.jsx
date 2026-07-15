import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { fetchCases, fetchStats } from '../redux/dataSlice'
import { api } from '../api/client.js'
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  Chip,
  TableContainer,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  Paper,
  Divider,
  CircularProgress,
  IconButton
} from '@mui/material'
import {
  FileText,
  AlertTriangle,
  CheckCircle,
  Activity,
  Users,
  Bookmark,
  Plus,
  RefreshCw,
  HelpCircle,
  Database,
  ChevronRight
} from 'lucide-react'

const STATUS_META = {
  uploaded:        { label: 'Uploaded',      color: 'default', variant: 'outlined' },
  processing:      { label: 'Processing',    color: 'warning', variant: 'outlined' },
  review_required: { label: 'Needs Review',  color: 'error',   variant: 'filled' },
  ready:           { label: 'Ready',         color: 'info',    variant: 'outlined' },
  approved:        { label: 'Approved',      color: 'success',  variant: 'filled' },
}

function StatCard({ value, label, Icon, color }) {
  return (
    <Card sx={{ 
      position: 'relative', 
      overflow: 'hidden', 
      transition: 'transform 0.2s, box-shadow 0.2s',
      '&:hover': {
        transform: 'translateY(-4px)',
        boxShadow: '0 8px 30px rgba(13, 148, 136, 0.08)'
      },
      '&::before': {
        content: '""',
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: '4px',
        bgcolor: color
      }
    }}>
      <CardContent sx={{ p: 3, '&:last-child': { pb: 3 } }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1.5 }}>
          <Typography variant="h3" sx={{ fontSize: '2.1rem', fontWeight: 800, color: 'text.primary', lineHeight: 1 }}>
            {value}
          </Typography>
          <Box sx={{ color: color, display: 'flex', alignItems: 'center', opacity: 0.85 }}>
            <Icon size={24} />
          </Box>
        </Box>
        <Typography variant="body2" sx={{ fontSize: '0.78rem', fontWeight: 700, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          {label}
        </Typography>
      </CardContent>
    </Card>
  )
}

function Skeleton() {
  return (
    <Box sx={{ p: 4 }}>
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {[...Array(6)].map((_, i) => (
          <Grid item xs={12} sm={6} md={2} key={i}>
            <Box className="skeleton" sx={{ height: 110, borderRadius: 3 }} />
          </Grid>
        ))}
      </Grid>
      <Box className="skeleton" sx={{ height: 420, borderRadius: 4 }} />
    </Box>
  )
}

export default function Dashboard() {
  const navigate = useNavigate()
  const dispatch = useDispatch()
  const { cases, stats, casesStatus, statsStatus } = useSelector(state => state.data)

  const loadData = () => {
    dispatch(fetchCases())
    dispatch(fetchStats())
  }

  useEffect(() => {
    if (casesStatus === 'idle') dispatch(fetchCases())
    if (statsStatus === 'idle') dispatch(fetchStats())
  }, [casesStatus, statsStatus, dispatch])

  const loading = casesStatus === 'loading' || statsStatus === 'loading' || casesStatus === 'idle' || statsStatus === 'idle'

  if (loading && (!cases || cases.length === 0)) return <Skeleton />

  return (
    <Box>
      {/* Topbar navigation panel */}
      <Box sx={{ 
        bgcolor: 'background.paper', 
        borderBottom: '1px solid #eee8e1', 
        p: '18px 32px', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between',
        sticky: 'top',
        zIndex: 50
      }}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 800, color: 'primary.dark', letterSpacing: '-0.02em' }}>
            Clinical Dashboard
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.2 }}>
            Central Discharge Care Plan Auditing & Management Portal
          </Typography>
        </Box>
        <Button 
          variant="contained" 
          startIcon={<Plus size={16} />}
          onClick={() => navigate('/cases/new')}
        >
          New Case
        </Button>
      </Box>

      <Box sx={{ p: 4 }}>
        {/* Stats Row Grid */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={4} lg={2}>
            <StatCard value={stats?.total_cases ?? 0}      label="Total Cases"    Icon={FileText} color="primary.main" />
          </Grid>
          <Grid item xs={12} sm={6} md={4} lg={2}>
            <StatCard value={stats?.review_required ?? 0}  label="Needs Review"   Icon={AlertTriangle} color="secondary.main" />
          </Grid>
          <Grid item xs={12} sm={6} md={4} lg={2}>
            <StatCard value={stats?.approved ?? 0}         label="Approved"       Icon={CheckCircle} color="success.main" />
          </Grid>
          <Grid item xs={12} sm={6} md={4} lg={2}>
            <StatCard value={stats?.ready ?? 0}            label="Ready"          Icon={Activity} color="info.main" />
          </Grid>
          <Grid item xs={12} sm={6} md={4} lg={2}>
            <StatCard value={stats?.total_patients ?? 0}   label="Patients"       Icon={Users} color="purple" />
          </Grid>
          <Grid item xs={12} sm={6} md={4} lg={2}>
            <StatCard value={stats?.flags_pending ?? 0}    label="Flags Pending"  Icon={Bookmark} color="warning.main" />
          </Grid>
        </Grid>

        {/* Case Table Panel */}
        <Card sx={{ mb: 4 }}>
          <Box sx={{ p: 3, borderBottom: '1px dashed #eee8e1', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 700, color: 'primary.dark' }}>
                All Discharge Cases
              </Typography>
              <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.2 }}>
                {cases.length} cases registered · click any row to review medical entities
              </Typography>
            </Box>
            <IconButton onClick={loadData} sx={{ border: '1px solid #eee8e1', borderRadius: 2 }}>
              <RefreshCw size={16} />
            </IconButton>
          </Box>

          {cases.length === 0 ? (
            <Box sx={{ p: 6, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
              <FileText size={48} strokeWidth={1.5} style={{ color: '#9ca3af', marginBottom: 16 }} />
              <Typography variant="h6" sx={{ fontWeight: 700, color: 'text.primary', mb: 1 }}>No cases yet</Typography>
              <Typography variant="body2" sx={{ color: 'text.disabled', mb: 3 }}>Create your first patient discharge profile to start generating care plans.</Typography>
              <Button variant="contained" onClick={() => navigate('/cases/new')}>Create New Case</Button>
            </Box>
          ) : (
            <TableContainer component={Paper} elevation={0} sx={{ borderRadius: 0 }}>
              <Table>
                <TableHead sx={{ bgcolor: '#fbfaf8' }}>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'text.secondary' }}>Patient Info</TableCell>
                    <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'text.secondary' }}>Primary Diagnoses</TableCell>
                    <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'text.secondary' }}>Clinical Status</TableCell>
                    <TableCell align="center" sx={{ fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'text.secondary' }}>Safety Flags</TableCell>
                    <TableCell align="center" sx={{ fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'text.secondary' }}>Care Plan</TableCell>
                    <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'text.secondary' }}>Discharge Date</TableCell>
                    <TableCell />
                  </TableRow>
                </TableHead>
                <TableBody>
                  {cases.map(c => {
                    const dest = c.has_care_plan ? `/cases/${c.id}/plan` : `/cases/${c.id}`
                    const statusMeta = STATUS_META[c.status] || STATUS_META.uploaded
                    return (
                      <TableRow 
                        key={c.id} 
                        hover 
                        onClick={() => navigate(dest)}
                        sx={{ cursor: 'pointer', '&:last-child td': { borderBottom: 0 } }}
                      >
                        <TableCell>
                          <Typography variant="body2" sx={{ fontWeight: 700, color: 'primary.dark' }}>
                            {c.patient_name}
                          </Typography>
                          <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                            {c.patient_age}y · {c.patient_id}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', gap: 0.8, flexWrap: 'wrap' }}>
                            {c.primary_diagnoses?.slice(0, 2).map(d => (
                              <Chip 
                                key={d}
                                size="small"
                                label={d.replace('Post-Myocardial Infarction (Post-PCI)', 'Post-MI')
                                  .replace('Congestive Heart Failure (CHF)', 'CHF')
                                  .replace('Enteric Fever (Typhoid)', 'Typhoid')
                                  .replace('Hypertension (Primary)', 'HTN')
                                  .replace('Chronic Kidney Disease Stage 3', 'CKD-3')
                                  .replace('Type 2 Diabetes Mellitus', 'T2DM')}
                                sx={{ 
                                  fontSize: '0.72rem', 
                                  bgcolor: 'primary.light' + '10', 
                                  color: 'primary.dark',
                                  border: '1px solid',
                                  borderColor: 'primary.light' + '30',
                                }}
                              />
                            ))}
                            {c.primary_diagnoses?.length > 2 && (
                              <Chip size="small" label={`+${c.primary_diagnoses.length - 2}`} />
                            )}
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Chip 
                            size="small" 
                            color={statusMeta.color} 
                            variant={statusMeta.variant} 
                            label={statusMeta.label}
                            sx={{ fontWeight: 700, fontSize: '0.68rem', letterSpacing: '0.04em' }}
                          />
                        </TableCell>
                        <TableCell align="center">
                          <Chip 
                            size="small"
                            label={c.flag_count}
                            color={c.flag_count > 0 ? 'error' : 'default'}
                            variant={c.flag_count > 0 ? 'filled' : 'outlined'}
                            sx={{ fontWeight: 700, minWidth: 28 }}
                          />
                        </TableCell>
                        <TableCell align="center">
                          {c.has_care_plan ? (
                            <Chip size="small" color="success" label="Signed Off" sx={{ fontWeight: 700 }} />
                          ) : (
                            <Typography variant="body2" sx={{ color: 'text.secondary' }}>—</Typography>
                          )}
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" sx={{ color: 'text.secondary', fontSize: '0.85rem' }}>
                            {new Date(c.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Button variant="text" size="small" endIcon={<ChevronRight size={14} />} onClick={e => { e.stopPropagation(); navigate(dest) }}>
                            View
                          </Button>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Card>

        {/* Guides Row */}
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent sx={{ p: 3 }}>
                <Typography variant="h6" sx={{ fontWeight: 700, color: 'primary.dark', mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                  <HelpCircle size={20} /> System Execution Workflow
                </Typography>
                <Divider sx={{ mb: 2 }} />
                {[
                  ['1. Create Patient Case', 'Submit demographic parameters & paste standard clinical discharge documents.'],
                  ['2. NLP Rule Extraction', 'Run the parsing client to build clinical interaction profiles & flags.'],
                  ['3. Synthesize Plan', 'Automate meals, medications, activity limits, and monitoring rules.'],
                  ['4. Physician Audit', 'Physicians review safety flags, add notes, and approve the portal release.'],
                ].map(([step, desc]) => (
                  <Box key={step} sx={{ display: 'flex', mb: 2, '&:last-child': { mb: 0 } }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700, color: 'primary.main', width: 140, flexShrink: 0 }}>
                      {step}
                    </Typography>
                    <Typography variant="body2" sx={{ color: 'text.secondary', ml: 2 }}>
                      {desc}
                    </Typography>
                  </Box>
                ))}
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent sx={{ p: 3 }}>
                <Typography variant="h6" sx={{ fontWeight: 700, color: 'primary.dark', mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Database size={20} /> Local Knowledge Base Profile
                </Typography>
                <Divider sx={{ mb: 2 }} />
                {[
                  ['Disease Rules', 'Custom protocols for T2DM, HTN, Stage 3 CKD, Post-PCI MI, Typhoid, CHF.'],
                  ['Medication Profile', '13 standard clinical medicines with interaction rules.'],
                  ['Diet Mapping', '6 customized Indian meal layouts matched to clinical diagnostics.'],
                  ['Vitals Monitor', 'Standardized threshold warning lines for temperature, BP, potassium, glucose.'],
                ].map(([k, v]) => (
                  <Box key={k} sx={{ display: 'flex', mb: 2, '&:last-child': { mb: 0 } }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700, color: 'text.primary', width: 140, flexShrink: 0 }}>
                      {k}
                    </Typography>
                    <Typography variant="body2" sx={{ color: 'text.secondary', ml: 2 }}>
                      {v}
                    </Typography>
                  </Box>
                ))}
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Box>
    </Box>
  )
}
