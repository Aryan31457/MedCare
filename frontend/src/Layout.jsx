import { useEffect, useState } from 'react'
import { NavLink, useLocation, useNavigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { logout } from './redux/authSlice.js'
import { fetchStats } from './redux/dataSlice.js'
import { api } from './api/client.js'
import {
  Box,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Typography,
  Badge,
  Avatar,
  Divider,
  Button
} from '@mui/material'
import {
  HeartPulse,
  LayoutDashboard,
  PlusCircle,
  AlertTriangle,
  BookOpen,
  Dna,
  LogOut,
  FolderHeart,
  ClipboardList
} from 'lucide-react'

const drawerWidth = 260;

export default function Layout({ children }) {
  const location = useLocation()
  const navigate = useNavigate()
  const dispatch = useDispatch()
  const { stats, statsStatus } = useSelector(state => state.data)

  useEffect(() => {
    if (statsStatus === 'idle') {
      dispatch(fetchStats())
    }
  }, [statsStatus, dispatch])

  const isActive = (path) => {
    if (path === '/') {
      return location.pathname === '/'
    }
    return location.pathname.startsWith(path)
  }

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'background.default' }}>
      {/* Sidebar Drawer */}
      <Drawer
        variant="permanent"
        sx={{
          width: drawerWidth,
          flexShrink: 0,
          [`& .MuiDrawer-paper`]: { 
            width: drawerWidth, 
            boxSizing: 'border-box',
            borderRight: '1px solid #eee8e1',
            bgcolor: 'background.paper',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            pb: 3
          },
        }}
      >
        <Box>
          {/* Logo Mark Header */}
          <Box sx={{ p: '24px 24px 20px', display: 'flex', alignItems: 'center', gap: 1.5, borderBottom: '1px solid #eee8e1' }}>
            <Box sx={{ color: 'primary.main', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <HeartPulse size={28} strokeWidth={2.5} />
            </Box>
            <Box>
              <Typography variant="h6" sx={{ fontSize: '1.2rem', fontWeight: 800, color: 'primary.dark', letterSpacing: '-0.02em', lineHeight: 1.2 }}>
                MedCare
              </Typography>
              <Typography sx={{ fontSize: '0.68rem', color: 'text.disabled', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', mt: 0.2 }}>
                Discharge System
              </Typography>
            </Box>
          </Box>

          <List sx={{ px: 1.5, py: 2 }}>
            <Typography variant="body2" sx={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'text.disabled', px: 2, mb: 1 }}>
              Clinical Hub
            </Typography>

            <ListItem disablePadding sx={{ mb: 0.5 }}>
              <ListItemButton
                onClick={() => navigate('/')}
                selected={isActive('/')}
                sx={{
                  borderRadius: 2.5,
                  py: 1.2,
                  px: 2,
                  '&.Mui-selected': {
                    bgcolor: 'primary.light' + '12',
                    color: 'primary.dark',
                    fontWeight: 600,
                    '&:hover': { bgcolor: 'primary.light' + '18' },
                  },
                }}
              >
                <ListItemIcon sx={{ minWidth: 32, color: isActive('/') ? 'primary.dark' : 'text.secondary' }}>
                  <LayoutDashboard size={18} />
                </ListItemIcon>
                <ListItemText primary={<Typography sx={{ fontSize: '0.88rem', fontWeight: isActive('/') ? 600 : 500 }}>Dashboard</Typography>} />
              </ListItemButton>
            </ListItem>

            <ListItem disablePadding sx={{ mb: 0.5 }}>
              <ListItemButton
                onClick={() => navigate('/cases/new')}
                selected={isActive('/cases/new')}
                sx={{
                  borderRadius: 2.5,
                  py: 1.2,
                  px: 2,
                  '&.Mui-selected': {
                    bgcolor: 'primary.light' + '12',
                    color: 'primary.dark',
                    fontWeight: 600,
                    '&:hover': { bgcolor: 'primary.light' + '18' },
                  },
                }}
              >
                <ListItemIcon sx={{ minWidth: 32, color: isActive('/cases/new') ? 'primary.dark' : 'text.secondary' }}>
                  <PlusCircle size={18} />
                </ListItemIcon>
                <ListItemText primary={<Typography sx={{ fontSize: '0.88rem', fontWeight: isActive('/cases/new') ? 600 : 500 }}>New Case</Typography>} />
              </ListItemButton>
            </ListItem>

            <ListItem disablePadding sx={{ mb: 0.5 }}>
              <ListItemButton
                onClick={() => navigate('/review')}
                selected={isActive('/review')}
                sx={{
                  borderRadius: 2.5,
                  py: 1.2,
                  px: 2,
                  '&.Mui-selected': {
                    bgcolor: 'primary.light' + '12',
                    color: 'primary.dark',
                    fontWeight: 600,
                    '&:hover': { bgcolor: 'primary.light' + '18' },
                  },
                }}
              >
                <ListItemIcon sx={{ minWidth: 32, color: isActive('/review') ? 'primary.dark' : 'text.secondary' }}>
                  <AlertTriangle size={18} />
                </ListItemIcon>
                <ListItemText primary={<Typography sx={{ fontSize: '0.88rem', fontWeight: isActive('/review') ? 600 : 500 }}>Review Queue</Typography>} />
                {stats?.review_required > 0 && (
                  <Badge badgeContent={stats.review_required} color="error" sx={{ mr: 1, '& .MuiBadge-badge': { fontWeight: 700 } }} />
                )}
              </ListItemButton>
            </ListItem>

            <Typography variant="body2" sx={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'text.disabled', px: 2, mt: 3, mb: 1 }}>
              Clinical Resources
            </Typography>

            <ListItem disablePadding sx={{ mb: 0.5 }}>
              <ListItemButton
                component="a"
                href="https://medcare-1-wc3h.onrender.com/docs"
                target="_blank"
                rel="noopener noreferrer"
                sx={{ borderRadius: 2.5, py: 1.2, px: 2 }}
              >
                <ListItemIcon sx={{ minWidth: 32, color: 'text.secondary' }}>
                  <BookOpen size={18} />
                </ListItemIcon>
                <ListItemText primary={<Typography sx={{ fontSize: '0.88rem', fontWeight: 500 }}>API Docs</Typography>} />
              </ListItemButton>
            </ListItem>

            <ListItem disablePadding sx={{ mb: 0.5 }}>
              <ListItemButton
                component="a"
                href="https://medcare-1-wc3h.onrender.com/api/kb/diseases"
                target="_blank"
                rel="noopener noreferrer"
                sx={{ borderRadius: 2.5, py: 1.2, px: 2 }}
              >
                <ListItemIcon sx={{ minWidth: 32, color: 'text.secondary' }}>
                  <Dna size={18} />
                </ListItemIcon>
                <ListItemText primary={<Typography sx={{ fontSize: '0.88rem', fontWeight: 500 }}>Disease KG</Typography>} />
              </ListItemButton>
            </ListItem>

            <ListItem disablePadding sx={{ mt: 3 }}>
              <ListItemButton
                onClick={() => dispatch(logout())}
                sx={{ borderRadius: 2.5, py: 1.2, px: 2, color: 'secondary.main', '&:hover': { bgcolor: 'secondary.light' + '10' } }}
              >
                <ListItemIcon sx={{ minWidth: 32, color: 'secondary.main' }}>
                  <LogOut size={18} />
                </ListItemIcon>
                <ListItemText primary={<Typography sx={{ fontSize: '0.88rem', fontWeight: 600 }}>Logout</Typography>} />
              </ListItemButton>
            </ListItem>
          </List>
        </Box>

        <Box sx={{ px: 3, pt: 2, borderTop: '1px solid #eee8e1' }}>
          {stats && (
            <Box sx={{ mb: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.8 }}>
                <ClipboardList size={14} style={{ color: '#9ca3af' }} />
                <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 500 }}>
                  {stats.total_cases} cases · {stats.total_patients} patients
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <FolderHeart size={14} style={{ color: '#9ca3af' }} />
                <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 500 }}>
                  {stats.flags_pending} flags pending
                </Typography>
              </Box>
            </Box>
          )}
          <Typography sx={{ fontSize: '0.72rem', color: 'text.disabled', fontWeight: 600 }}>
            MedCare System v1.0
          </Typography>
          <Typography sx={{ fontSize: '0.72rem', color: 'text.disabled', mt: 0.2 }}>
            Connected to Local KB
          </Typography>
        </Box>
      </Drawer>

      <Box component="main" sx={{ flexGrow: 1, minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        {children}
      </Box>
    </Box>
  )
}
