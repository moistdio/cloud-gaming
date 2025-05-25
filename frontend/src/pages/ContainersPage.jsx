import React, { useState, useEffect } from 'react'
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Chip,
  Grid,
  Alert,
  CircularProgress,
  IconButton,
  Tooltip,
  Stack,
  Divider,
  InputAdornment
} from '@mui/material'
import {
  PlayArrow as StartIcon,
  Stop as StopIcon,
  Delete as DeleteIcon,
  Add as AddIcon,
  Computer as ComputerIcon,
  Visibility as ViewIcon,
  Refresh as RefreshIcon,
  Key as KeyIcon,
  ContentCopy as CopyIcon,
  VisibilityOff as VisibilityOffIcon
} from '@mui/icons-material'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'

import { api } from '../services/api'
import { useAuth } from '../contexts/AuthContext'

const ContainersPage = () => {
  const [container, setContainer] = useState(null)
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const { user } = useAuth()

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset
  } = useForm()

  // Container-Daten laden
  const loadContainer = async () => {
    try {
      setLoading(true)
      const response = await api.get('/containers')
      setContainer(response.data.container)
    } catch (error) {
      console.error('Fehler beim Laden der Container:', error)
      toast.error('Container konnten nicht geladen werden')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadContainer()
  }, [])

  // Passwort in Zwischenablage kopieren
  const copyPasswordToClipboard = async () => {
    if (!container?.vncPassword) {
      toast.error('Kein Passwort verfügbar')
      return
    }

    try {
      // Moderne Clipboard API (bevorzugt)
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(container.vncPassword)
        toast.success('Passwort in Zwischenablage kopiert!')
        return
      }

      // Fallback für ältere Browser
      const textArea = document.createElement('textarea')
      textArea.value = container.vncPassword
      textArea.style.position = 'fixed'
      textArea.style.left = '-999999px'
      textArea.style.top = '-999999px'
      document.body.appendChild(textArea)
      textArea.focus()
      textArea.select()
      
      const successful = document.execCommand('copy')
      document.body.removeChild(textArea)
      
      if (successful) {
        toast.success('Passwort in Zwischenablage kopiert!')
      } else {
        throw new Error('execCommand failed')
      }
    } catch (error) {
      console.error('Fehler beim Kopieren:', error)
      
      // Als letzter Ausweg: Passwort in einem Alert anzeigen
      const password = container.vncPassword
      if (window.prompt) {
        window.prompt('Passwort kopieren (Strg+C):', password)
      } else {
        alert(`VNC-Passwort: ${password}`)
      }
      toast.info('Passwort wurde angezeigt - bitte manuell kopieren')
    }
  }

  // VNC-Passwort regenerieren
  const handleRegeneratePassword = async () => {
    if (!window.confirm('Sind Sie sicher, dass Sie ein neues VNC-Passwort generieren möchten? Das alte Passwort wird ungültig.')) {
      return
    }

    try {
      setActionLoading(true)
      const response = await api.post('/containers/regenerate-password')
      toast.success('Neues VNC-Passwort generiert!')
      
      // Container-Daten neu laden um das neue Passwort zu erhalten
      await loadContainer()
      
      // Neues Passwort anzeigen
      if (response.data.newPassword) {
        toast.success(`Neues Passwort: ${response.data.newPassword}`, {
          duration: 10000
        })
      }
    } catch (error) {
      console.error('Fehler beim Regenerieren des Passworts:', error)
      const message = error.response?.data?.error || 'Passwort konnte nicht regeneriert werden'
      toast.error(message)
    } finally {
      setActionLoading(false)
    }
  }

  // Container erstellen
  const handleCreateContainer = async (data) => {
    try {
      setActionLoading(true)
      const response = await api.post('/containers/create', {
        containerName: data.containerName
      })
      
      toast.success('Container erfolgreich erstellt!')
      setCreateDialogOpen(false)
      reset()
      await loadContainer()
    } catch (error) {
      console.error('Fehler beim Erstellen des Containers:', error)
      const message = error.response?.data?.error || 'Container konnte nicht erstellt werden'
      toast.error(message)
    } finally {
      setActionLoading(false)
    }
  }

  // Container starten
  const handleStartContainer = async () => {
    try {
      setActionLoading(true)
      await api.post('/containers/start')
      toast.success('Container erfolgreich gestartet!')
      await loadContainer()
    } catch (error) {
      console.error('Fehler beim Starten des Containers:', error)
      const message = error.response?.data?.error || 'Container konnte nicht gestartet werden'
      toast.error(message)
    } finally {
      setActionLoading(false)
    }
  }

  // Container stoppen
  const handleStopContainer = async () => {
    try {
      setActionLoading(true)
      await api.post('/containers/stop')
      toast.success('Container erfolgreich gestoppt!')
      await loadContainer()
    } catch (error) {
      console.error('Fehler beim Stoppen des Containers:', error)
      const message = error.response?.data?.error || 'Container konnte nicht gestoppt werden'
      toast.error(message)
    } finally {
      setActionLoading(false)
    }
  }

  // Container löschen
  const handleDeleteContainer = async () => {
    if (!window.confirm('Sind Sie sicher, dass Sie den Container löschen möchten? Diese Aktion kann nicht rückgängig gemacht werden.')) {
      return
    }

    try {
      setActionLoading(true)
      await api.delete('/containers')
      toast.success('Container erfolgreich gelöscht!')
      await loadContainer()
    } catch (error) {
      console.error('Fehler beim Löschen des Containers:', error)
      const message = error.response?.data?.error || 'Container konnte nicht gelöscht werden'
      toast.error(message)
    } finally {
      setActionLoading(false)
    }
  }

  // Status-Chip-Farbe bestimmen
  const getStatusColor = (status) => {
    switch (status) {
      case 'running':
        return 'success'
      case 'created':
        return 'info'
      case 'exited':
        return 'warning'
      default:
        return 'default'
    }
  }

  // Status-Text übersetzen
  const getStatusText = (status) => {
    switch (status) {
      case 'running':
        return 'Läuft'
      case 'created':
        return 'Erstellt'
      case 'exited':
        return 'Gestoppt'
      case 'not_found':
        return 'Nicht gefunden'
      default:
        return status
    }
  }

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    )
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          🖥️ Mein Desktop-Container
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Verwalten Sie Ihren persönlichen virtuellen Desktop
        </Typography>
      </Box>

      {/* Container-Karte oder Erstellen-Karte */}
      {container ? (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Grid container spacing={3} alignItems="center">
              {/* Container-Info */}
              <Grid item xs={12} md={6}>
                <Stack spacing={2}>
                  <Box display="flex" alignItems="center" gap={2}>
                    <ComputerIcon color="primary" />
                    <Typography variant="h6">{container.name}</Typography>
                    <Chip 
                      label={getStatusText(container.status)} 
                      color={getStatusColor(container.status)}
                      size="small"
                    />
                  </Box>
                  
                  <Typography variant="body2" color="text.secondary">
                    Erstellt: {new Date(container.createdAt).toLocaleDateString('de-DE')}
                  </Typography>

                  {container.status === 'running' && (
                    <Box>
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        Verbindungsdetails:
                      </Typography>
                      <Typography variant="body2">
                        VNC-Port: {container.vncPort}
                      </Typography>
                      <Typography variant="body2">
                        Web-VNC-Port: {container.webVncPort}
                      </Typography>
                      
                      <Box sx={{ mt: 2 }}>
                        <Typography variant="body2" color="text.secondary" gutterBottom>
                          VNC-Passwort:
                        </Typography>
                        <TextField
                          size="small"
                          value={container.vncPassword || 'cloudgaming'}
                          type={showPassword ? 'text' : 'password'}
                          InputProps={{
                            readOnly: true,
                            endAdornment: (
                              <InputAdornment position="end">
                                <Tooltip title={showPassword ? 'Passwort verbergen' : 'Passwort anzeigen'}>
                                  <IconButton
                                    onClick={() => setShowPassword(!showPassword)}
                                    edge="end"
                                    size="small"
                                  >
                                    {showPassword ? <VisibilityOffIcon /> : <ViewIcon />}
                                  </IconButton>
                                </Tooltip>
                                <Tooltip title="Passwort kopieren">
                                  <IconButton
                                    onClick={copyPasswordToClipboard}
                                    edge="end"
                                    size="small"
                                  >
                                    <CopyIcon />
                                  </IconButton>
                                </Tooltip>
                              </InputAdornment>
                            )
                          }}
                          sx={{ width: '100%', maxWidth: 300 }}
                        />
                        <Button
                          size="small"
                          startIcon={<KeyIcon />}
                          onClick={handleRegeneratePassword}
                          disabled={actionLoading}
                          sx={{ mt: 1 }}
                        >
                          Neues Passwort generieren
                        </Button>
                      </Box>
                    </Box>
                  )}
                </Stack>
              </Grid>

              {/* Aktionen */}
              <Grid item xs={12} md={6}>
                <Stack direction="row" spacing={1} justifyContent="flex-end" flexWrap="wrap">
                  <Tooltip title="Container-Status aktualisieren">
                    <IconButton onClick={loadContainer} disabled={actionLoading}>
                      <RefreshIcon />
                    </IconButton>
                  </Tooltip>

                  {container.status === 'running' ? (
                    <>
                      <Tooltip title="Desktop im Browser öffnen">
                        <Button
                          variant="outlined"
                          startIcon={<ViewIcon />}
                          onClick={() => window.open(`http://${window.location.hostname}:${container.webVncPort}`, '_blank')}
                          disabled={actionLoading}
                        >
                          Desktop öffnen
                        </Button>
                      </Tooltip>
                      
                      <Button
                        variant="outlined"
                        color="warning"
                        startIcon={<StopIcon />}
                        onClick={handleStopContainer}
                        disabled={actionLoading}
                      >
                        Stoppen
                      </Button>
                    </>
                  ) : (
                    <Button
                      variant="contained"
                      startIcon={<StartIcon />}
                      onClick={handleStartContainer}
                      disabled={actionLoading}
                    >
                      Starten
                    </Button>
                  )}

                  <Button
                    variant="outlined"
                    color="error"
                    startIcon={<DeleteIcon />}
                    onClick={handleDeleteContainer}
                    disabled={actionLoading}
                  >
                    Löschen
                  </Button>
                </Stack>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent sx={{ textAlign: 'center', py: 6 }}>
            <ComputerIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" gutterBottom>
              Kein Container vorhanden
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Erstellen Sie Ihren ersten virtuellen Desktop-Container
            </Typography>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setCreateDialogOpen(true)}
              disabled={actionLoading}
            >
              Container erstellen
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Informationen */}
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            ℹ️ Informationen
          </Typography>
          <Divider sx={{ mb: 2 }} />
          
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle2" gutterBottom>
                Desktop-Umgebung
              </Typography>
              <Typography variant="body2" color="text.secondary">
                • Ubuntu 22.04 mit XFCE4-Desktop
                <br />
                • Firefox Browser
                <br />
                • LibreOffice Suite
                <br />
                • Entwicklungstools (Git, Nano, Vim)
              </Typography>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle2" gutterBottom>
                Zugriffsmöglichkeiten
              </Typography>
              <Typography variant="body2" color="text.secondary">
                • Web-Browser (noVNC)
                <br />
                • VNC-Client (TightVNC, RealVNC)
                <br />
                • Port-Bereich: VNC 11000-11430, Web 12000-12430
                <br />
                • Automatische Port-Zuweisung
                <br />
                • Maximal 430 gleichzeitige Container
              </Typography>
            </Grid>
          </Grid>

          {user?.isAdmin && (
            <Alert severity="info" sx={{ mt: 2 }}>
              <Typography variant="body2">
                <strong>Administrator-Hinweis:</strong> Als Administrator können Sie alle Container-Logs 
                über die Benutzer-Verwaltung einsehen.
              </Typography>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Container-Erstellungs-Dialog */}
      <Dialog 
        open={createDialogOpen} 
        onClose={() => setCreateDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          Neuen Container erstellen
        </DialogTitle>
        <DialogContent>
          <Box component="form" onSubmit={handleSubmit(handleCreateContainer)} sx={{ mt: 1 }}>
            <TextField
              fullWidth
              label="Container-Name"
              variant="outlined"
              {...register('containerName', {
                required: 'Container-Name ist erforderlich',
                minLength: {
                  value: 3,
                  message: 'Name muss mindestens 3 Zeichen lang sein'
                },
                maxLength: {
                  value: 50,
                  message: 'Name darf maximal 50 Zeichen lang sein'
                },
                pattern: {
                  value: /^[a-zA-Z0-9_-\s]+$/,
                  message: 'Nur Buchstaben, Zahlen, Leerzeichen, _ und - erlaubt'
                }
              })}
              error={!!errors.containerName}
              helperText={errors.containerName?.message}
              disabled={actionLoading}
              placeholder="z.B. Mein Desktop"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => setCreateDialogOpen(false)}
            disabled={actionLoading}
          >
            Abbrechen
          </Button>
          <Button 
            onClick={handleSubmit(handleCreateContainer)}
            variant="contained"
            disabled={actionLoading}
            startIcon={actionLoading ? <CircularProgress size={20} /> : <AddIcon />}
          >
            Erstellen
          </Button>
        </DialogActions>
      </Dialog>

      {/* Loading-Overlay */}
      {actionLoading && (
        <Box
          sx={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999
          }}
        >
          <CircularProgress />
        </Box>
      )}
    </Box>
  )
}

export default ContainersPage 