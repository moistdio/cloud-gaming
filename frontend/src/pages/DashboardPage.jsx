import React, { useState, useEffect } from 'react'
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Chip,
  LinearProgress,
  Avatar,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  Alert,
  CircularProgress,
  IconButton,
  Tooltip,
  Stack,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Badge
} from '@mui/material'
import {
  Dashboard as DashboardIcon,
  Computer as ComputerIcon,
  PlayArrow as PlayIcon,
  Stop as StopIcon,
  People as PeopleIcon,
  Storage as StorageIcon,
  Speed as SpeedIcon,
  Timeline as TimelineIcon,
  Security as SecurityIcon,
  CloudQueue as CloudIcon,
  Memory as MemoryIcon,
  Router as RouterIcon,
  Refresh as RefreshIcon,
  TrendingUp as TrendingUpIcon,
  AccessTime as AccessTimeIcon,
  AccountCircle as AccountIcon,
  AdminPanelSettings as AdminIcon,
  Visibility as VisibilityIcon,
  Code as CodeIcon,
  Public as PublicIcon
} from '@mui/icons-material'
import toast from 'react-hot-toast'

import { userAPI } from '../services/api'
import { useAuth } from '../contexts/AuthContext'

const DashboardPage = () => {
  const [dashboardData, setDashboardData] = useState(null)
  const [loading, setLoading] = useState(true)
  const { user, isAdmin } = useAuth()

  // Dashboard-Daten laden
  const loadDashboardData = async () => {
    try {
      setLoading(true)
      const response = await userAPI.getDashboardStats()
      setDashboardData(response.data)
    } catch (error) {
      console.error('Fehler beim Laden der Dashboard-Daten:', error)
      toast.error('Dashboard-Daten konnten nicht geladen werden')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadDashboardData()
  }, [])

  // Uptime formatieren
  const formatUptime = (seconds) => {
    const days = Math.floor(seconds / 86400)
    const hours = Math.floor((seconds % 86400) / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    
    if (days > 0) {
      return `${days}d ${hours}h ${minutes}m`
    } else if (hours > 0) {
      return `${hours}h ${minutes}m`
    } else {
      return `${minutes}m`
    }
  }

  // Status-Farbe bestimmen
  const getStatusColor = (status) => {
    switch (status) {
      case 'running': return 'success'
      case 'created': return 'info'
      case 'exited': return 'warning'
      default: return 'default'
    }
  }

  // Aktivitäts-Icon bestimmen
  const getActivityIcon = (action) => {
    if (action.includes('CONTAINER_CREATE')) return <ComputerIcon />
    if (action.includes('CONTAINER_START')) return <PlayIcon />
    if (action.includes('CONTAINER_STOP')) return <StopIcon />
    if (action.includes('LOGIN')) return <SecurityIcon />
    if (action.includes('REGISTER')) return <AccountIcon />
    return <TimelineIcon />
  }

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress size={60} />
      </Box>
    )
  }

  if (!dashboardData) {
    return (
      <Alert severity="error">
        Dashboard-Daten konnten nicht geladen werden
      </Alert>
    )
  }

  const { user: userData, system, resources, serverInfo } = dashboardData

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ mb: 4, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Box>
          <Typography variant="h4" component="h1" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <DashboardIcon sx={{ fontSize: 40, color: 'primary.main' }} />
            🎮 Cloud Gaming Dashboard
            {isAdmin() && (
              <Chip 
                icon={<AdminIcon />} 
                label="Administrator" 
                color="primary" 
                variant="outlined" 
                size="small"
              />
            )}
          </Typography>
          <Typography variant="h6" color="text.secondary">
            Willkommen zurück, {userData.username}! 👋
          </Typography>
        </Box>
        <Tooltip title="Dashboard aktualisieren">
          <IconButton onClick={loadDashboardData} color="primary">
            <RefreshIcon />
          </IconButton>
        </Tooltip>
      </Box>

      <Grid container spacing={3}>
        {/* Benutzer-Statistiken */}
        <Grid item xs={12} md={6} lg={3}>
          <Card sx={{ height: '100%', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white' }}>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography variant="h4" fontWeight="bold">
                    {userData.stats.totalContainers}
                  </Typography>
                  <Typography variant="body2" sx={{ opacity: 0.9 }}>
                    Meine Container
                  </Typography>
                </Box>
                <ComputerIcon sx={{ fontSize: 40, opacity: 0.8 }} />
              </Box>
              <Box sx={{ mt: 2 }}>
                <Typography variant="body2" sx={{ opacity: 0.9 }}>
                  Aktiv: {userData.stats.runningContainers}
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6} lg={3}>
          <Card sx={{ height: '100%', background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)', color: 'white' }}>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography variant="h4" fontWeight="bold">
                    {userData.stats.totalActions}
                  </Typography>
                  <Typography variant="body2" sx={{ opacity: 0.9 }}>
                    Meine Aktivitäten
                  </Typography>
                </Box>
                <TimelineIcon sx={{ fontSize: 40, opacity: 0.8 }} />
              </Box>
              <Box sx={{ mt: 2 }}>
                <Typography variant="body2" sx={{ opacity: 0.9 }}>
                  Seit {new Date(userData.created_at).toLocaleDateString('de-DE')}
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6} lg={3}>
          <Card sx={{ height: '100%', background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)', color: 'white' }}>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography variant="h4" fontWeight="bold">
                    {resources.portUtilization}%
                  </Typography>
                  <Typography variant="body2" sx={{ opacity: 0.9 }}>
                    Port-Auslastung
                  </Typography>
                </Box>
                <RouterIcon sx={{ fontSize: 40, opacity: 0.8 }} />
              </Box>
              <Box sx={{ mt: 2 }}>
                <LinearProgress 
                  variant="determinate" 
                  value={resources.portUtilization} 
                  sx={{ 
                    backgroundColor: 'rgba(255,255,255,0.3)',
                    '& .MuiLinearProgress-bar': {
                      backgroundColor: 'white'
                    }
                  }}
                />
                <Typography variant="body2" sx={{ opacity: 0.9, mt: 1 }}>
                  {resources.usedPorts} / {resources.maxPorts} Ports
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6} lg={3}>
          <Card sx={{ height: '100%', background: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)', color: 'white' }}>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography variant="h4" fontWeight="bold">
                    {formatUptime(serverInfo.uptime)}
                  </Typography>
                  <Typography variant="body2" sx={{ opacity: 0.9 }}>
                    Server-Laufzeit
                  </Typography>
                </Box>
                <SpeedIcon sx={{ fontSize: 40, opacity: 0.8 }} />
              </Box>
              <Box sx={{ mt: 2 }}>
                <Typography variant="body2" sx={{ opacity: 0.9 }}>
                  {serverInfo.platform} • {serverInfo.nodeVersion}
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* System-Statistiken (nur für Admins) */}
        {isAdmin() && system && (
          <>
            <Grid item xs={12}>
              <Typography variant="h5" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <AdminIcon color="primary" />
                Administrator-Übersicht
              </Typography>
            </Grid>

            <Grid item xs={12} md={6} lg={3}>
              <Card sx={{ height: '100%' }}>
                <CardContent sx={{ textAlign: 'center' }}>
                  <PeopleIcon sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
                  <Typography variant="h4" fontWeight="bold" color="primary">
                    {system.total_users}
                  </Typography>
                  <Typography variant="body1" color="text.secondary">
                    Registrierte Benutzer
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={6} lg={3}>
              <Card sx={{ height: '100%' }}>
                <CardContent sx={{ textAlign: 'center' }}>
                  <CloudIcon sx={{ fontSize: 48, color: 'success.main', mb: 2 }} />
                  <Typography variant="h4" fontWeight="bold" color="success.main">
                    {system.total_containers}
                  </Typography>
                  <Typography variant="body1" color="text.secondary">
                    Gesamt Container
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {system.running_containers} aktiv
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={6} lg={3}>
              <Card sx={{ height: '100%' }}>
                <CardContent sx={{ textAlign: 'center' }}>
                  <TrendingUpIcon sx={{ fontSize: 48, color: 'warning.main', mb: 2 }} />
                  <Typography variant="h4" fontWeight="bold" color="warning.main">
                    {system.total_actions}
                  </Typography>
                  <Typography variant="body1" color="text.secondary">
                    Gesamt Aktivitäten
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {system.active_days} aktive Tage
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={6} lg={3}>
              <Card sx={{ height: '100%' }}>
                <CardContent sx={{ textAlign: 'center' }}>
                  <StorageIcon sx={{ fontSize: 48, color: 'info.main', mb: 2 }} />
                  <Typography variant="h4" fontWeight="bold" color="info.main">
                    {resources.availablePorts}
                  </Typography>
                  <Typography variant="body1" color="text.secondary">
                    Verfügbare Ports
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    von {resources.maxPorts} gesamt
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </>
        )}

        {/* Letzte Aktivitäten */}
        <Grid item xs={12} md={6}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <AccessTimeIcon color="primary" />
                Meine letzten Aktivitäten
              </Typography>
              <Divider sx={{ mb: 2 }} />
              
              {userData.recentActivities && userData.recentActivities.length > 0 ? (
                <List dense>
                  {userData.recentActivities.map((activity, index) => (
                    <ListItem key={index} sx={{ px: 0 }}>
                      <ListItemIcon>
                        {getActivityIcon(activity.action)}
                      </ListItemIcon>
                      <ListItemText
                        primary={activity.action.replace('_', ' ')}
                        secondary={`${activity.details || 'Keine Details'} • ${new Date(activity.created_at).toLocaleString('de-DE')}`}
                      />
                    </ListItem>
                  ))}
                </List>
              ) : (
                <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
                  Noch keine Aktivitäten vorhanden
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* System-Informationen */}
        <Grid item xs={12} md={6}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <CodeIcon color="primary" />
                System-Informationen
              </Typography>
              <Divider sx={{ mb: 2 }} />
              
              <Stack spacing={2}>
                <Box display="flex" justifyContent="space-between" alignItems="center">
                  <Typography variant="body2" color="text.secondary">
                    Server-Status
                  </Typography>
                  <Chip label="Online" color="success" size="small" />
                </Box>
                
                <Box display="flex" justifyContent="space-between" alignItems="center">
                  <Typography variant="body2" color="text.secondary">
                    Plattform
                  </Typography>
                  <Typography variant="body2">
                    {serverInfo.platform}
                  </Typography>
                </Box>
                
                <Box display="flex" justifyContent="space-between" alignItems="center">
                  <Typography variant="body2" color="text.secondary">
                    Node.js Version
                  </Typography>
                  <Typography variant="body2">
                    {serverInfo.nodeVersion}
                  </Typography>
                </Box>
                
                <Box display="flex" justifyContent="space-between" alignItems="center">
                  <Typography variant="body2" color="text.secondary">
                    Letzter Start
                  </Typography>
                  <Typography variant="body2">
                    {new Date(Date.now() - serverInfo.uptime * 1000).toLocaleString('de-DE')}
                  </Typography>
                </Box>

                <Box display="flex" justifyContent="space-between" alignItems="center">
                  <Typography variant="body2" color="text.secondary">
                    Port-Range
                  </Typography>
                  <Typography variant="body2">
                    VNC: 11000-11430, Web: 12000-12430
                  </Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        {/* Top-Benutzer (nur für Admins) */}
        {isAdmin() && system?.topUsers && (
          <Grid item xs={12} md={6}>
            <Card sx={{ height: '100%' }}>
              <CardContent>
                <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <TrendingUpIcon color="primary" />
                  Top-Benutzer (Aktivität)
                </Typography>
                <Divider sx={{ mb: 2 }} />
                
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Benutzer</TableCell>
                        <TableCell align="right">Container</TableCell>
                        <TableCell align="right">Aktivitäten</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {system.topUsers.map((user, index) => (
                        <TableRow key={index}>
                          <TableCell>
                            <Box display="flex" alignItems="center" gap={1}>
                              <Avatar sx={{ width: 24, height: 24, fontSize: 12 }}>
                                {user.username.charAt(0).toUpperCase()}
                              </Avatar>
                              {user.username}
                            </Box>
                          </TableCell>
                          <TableCell align="right">
                            <Badge badgeContent={user.container_count} color="primary">
                              <ComputerIcon fontSize="small" />
                            </Badge>
                          </TableCell>
                          <TableCell align="right">
                            {user.action_count}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </CardContent>
            </Card>
          </Grid>
        )}

        {/* Container-Status-Verteilung (nur für Admins) */}
        {isAdmin() && system?.containerStatusDistribution && (
          <Grid item xs={12} md={6}>
            <Card sx={{ height: '100%' }}>
              <CardContent>
                <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <VisibilityIcon color="primary" />
                  Container-Status-Verteilung
                </Typography>
                <Divider sx={{ mb: 2 }} />
                
                <Stack spacing={2}>
                  {system.containerStatusDistribution.map((status, index) => (
                    <Box key={index} display="flex" justifyContent="space-between" alignItems="center">
                      <Box display="flex" alignItems="center" gap={1}>
                        <Chip 
                          label={status.status} 
                          color={getStatusColor(status.status)} 
                          size="small" 
                        />
                      </Box>
                      <Typography variant="h6" fontWeight="bold">
                        {status.count}
                      </Typography>
                    </Box>
                  ))}
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        )}

        {/* Benutzer-Profil */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <AccountIcon color="primary" />
                Mein Profil
              </Typography>
              <Divider sx={{ mb: 3 }} />
              
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Stack spacing={2}>
                    <Box display="flex" justifyContent="space-between" alignItems="center">
                      <Typography variant="body2" color="text.secondary">
                        Benutzername
                      </Typography>
                      <Typography variant="body1" fontWeight="medium">
                        {userData.username}
                      </Typography>
                    </Box>
                    
                    <Box display="flex" justifyContent="space-between" alignItems="center">
                      <Typography variant="body2" color="text.secondary">
                        E-Mail
                      </Typography>
                      <Typography variant="body1">
                        {userData.email}
                      </Typography>
                    </Box>
                    
                    <Box display="flex" justifyContent="space-between" alignItems="center">
                      <Typography variant="body2" color="text.secondary">
                        Rolle
                      </Typography>
                      <Chip 
                        label={userData.is_admin ? 'Administrator' : 'Benutzer'} 
                        color={userData.is_admin ? 'primary' : 'default'}
                        size="small"
                        icon={userData.is_admin ? <AdminIcon /> : <AccountIcon />}
                      />
                    </Box>
                  </Stack>
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <Stack spacing={2}>
                    <Box display="flex" justifyContent="space-between" alignItems="center">
                      <Typography variant="body2" color="text.secondary">
                        Registriert seit
                      </Typography>
                      <Typography variant="body1">
                        {new Date(userData.created_at).toLocaleDateString('de-DE')}
                      </Typography>
                    </Box>
                    
                    <Box display="flex" justifyContent="space-between" alignItems="center">
                      <Typography variant="body2" color="text.secondary">
                        Letzter Login
                      </Typography>
                      <Typography variant="body1">
                        {userData.last_login ? new Date(userData.last_login).toLocaleString('de-DE') : 'Nie'}
                      </Typography>
                    </Box>
                    
                    <Box display="flex" justifyContent="space-between" alignItems="center">
                      <Typography variant="body2" color="text.secondary">
                        Letzter Container
                      </Typography>
                      <Typography variant="body1">
                        {userData.stats.lastContainerCreated ? 
                          new Date(userData.stats.lastContainerCreated).toLocaleDateString('de-DE') : 
                          'Noch keiner'
                        }
                      </Typography>
                    </Box>
                  </Stack>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Schnellzugriff */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <PublicIcon color="primary" />
                🚀 Schnellzugriff
              </Typography>
              <Divider sx={{ mb: 3 }} />
              
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6} md={3}>
                  <Paper 
                    sx={{ 
                      p: 2, 
                      textAlign: 'center', 
                      cursor: 'pointer',
                      '&:hover': { backgroundColor: 'action.hover' }
                    }}
                    onClick={() => window.location.href = '/containers'}
                  >
                    <ComputerIcon sx={{ fontSize: 32, color: 'primary.main', mb: 1 }} />
                    <Typography variant="body2" fontWeight="medium">
                      Container verwalten
                    </Typography>
                  </Paper>
                </Grid>
                
                <Grid item xs={12} sm={6} md={3}>
                  <Paper 
                    sx={{ 
                      p: 2, 
                      textAlign: 'center', 
                      cursor: 'pointer',
                      '&:hover': { backgroundColor: 'action.hover' }
                    }}
                    onClick={() => window.open('https://github.com/docker/docker', '_blank')}
                  >
                    <CodeIcon sx={{ fontSize: 32, color: 'secondary.main', mb: 1 }} />
                    <Typography variant="body2" fontWeight="medium">
                      Docker Docs
                    </Typography>
                  </Paper>
                </Grid>
                
                <Grid item xs={12} sm={6} md={3}>
                  <Paper 
                    sx={{ 
                      p: 2, 
                      textAlign: 'center', 
                      cursor: 'pointer',
                      '&:hover': { backgroundColor: 'action.hover' }
                    }}
                    onClick={() => window.open('https://novnc.com/', '_blank')}
                  >
                    <VisibilityIcon sx={{ fontSize: 32, color: 'success.main', mb: 1 }} />
                    <Typography variant="body2" fontWeight="medium">
                      noVNC Info
                    </Typography>
                  </Paper>
                </Grid>
                
                {isAdmin() && (
                  <Grid item xs={12} sm={6} md={3}>
                    <Paper 
                      sx={{ 
                        p: 2, 
                        textAlign: 'center', 
                        cursor: 'pointer',
                        '&:hover': { backgroundColor: 'action.hover' }
                      }}
                      onClick={() => window.location.href = '/users'}
                    >
                      <AdminIcon sx={{ fontSize: 32, color: 'warning.main', mb: 1 }} />
                      <Typography variant="body2" fontWeight="medium">
                        Benutzer verwalten
                      </Typography>
                    </Paper>
                  </Grid>
                )}
              </Grid>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  )
}

export default DashboardPage 