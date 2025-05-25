import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Chip,
  Grid,
  Alert,
  CircularProgress,
  Tooltip,
  IconButton
} from '@mui/material';
import {
  Refresh as RefreshIcon,
  Memory as MemoryIcon,
  Speed as SpeedIcon,
  Videocam as VideocamIcon,
  SportsEsports as GamingIcon
} from '@mui/icons-material';
import { containerService } from '../services/api';

const GPUStatus = () => {
  const [gpuInfo, setGpuInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadGPUStatus = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await containerService.getGPUStatus();
      setGpuInfo(response.gpu);
    } catch (err) {
      console.error('Fehler beim Laden des GPU-Status:', err);
      setError('GPU-Status konnte nicht geladen werden');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadGPUStatus();
  }, []);

  const getStatusColor = (available) => {
    return available ? 'success' : 'error';
  };

  const getCapabilityIcon = (capability) => {
    switch (capability) {
      case 'cuda':
        return <SpeedIcon fontSize="small" />;
      case 'opengl':
        return <GamingIcon fontSize="small" />;
      case 'video_encode':
      case 'video_decode':
        return <VideocamIcon fontSize="small" />;
      default:
        return <MemoryIcon fontSize="small" />;
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent>
          <Box display="flex" alignItems="center" justifyContent="center" py={2}>
            <CircularProgress size={24} sx={{ mr: 2 }} />
            <Typography>GPU-Status wird geladen...</Typography>
          </Box>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent>
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
          <Box display="flex" justifyContent="center">
            <IconButton onClick={loadGPUStatus} color="primary">
              <RefreshIcon />
            </IconButton>
          </Box>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent>
        <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
          <Typography variant="h6" component="h3">
            🎮 GPU-Status
          </Typography>
          <Tooltip title="Status aktualisieren">
            <IconButton onClick={loadGPUStatus} size="small">
              <RefreshIcon />
            </IconButton>
          </Tooltip>
        </Box>

        {/* GPU-Verfügbarkeit */}
        <Box mb={3}>
          <Typography variant="subtitle2" gutterBottom>
            Verfügbarkeit
          </Typography>
          <Box display="flex" gap={1} flexWrap="wrap">
            <Chip
              label={gpuInfo?.available ? 'GPU Verfügbar' : 'Keine GPU'}
              color={getStatusColor(gpuInfo?.available)}
              size="small"
            />
            {gpuInfo?.nvidia && (
              <Chip
                label="NVIDIA"
                color="success"
                size="small"
              />
            )}
            {gpuInfo?.runtime_support && (
              <Chip
                label="Container Runtime"
                color="success"
                size="small"
              />
            )}
          </Box>
        </Box>

        {/* GPU-Geräte */}
        {gpuInfo?.devices && gpuInfo.devices.length > 0 && (
          <Box mb={3}>
            <Typography variant="subtitle2" gutterBottom>
              GPU-Geräte
            </Typography>
            {gpuInfo.devices.map((device, index) => (
              <Box key={index} mb={1}>
                <Typography variant="body2" fontWeight="medium">
                  {device.name}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Treiber: {device.driver_version} • 
                  Speicher: {Math.round(device.memory_mb / 1024)}GB
                </Typography>
              </Box>
            ))}
          </Box>
        )}

        {/* Capabilities */}
        {gpuInfo?.capabilities && (
          <Box mb={3}>
            <Typography variant="subtitle2" gutterBottom>
              Unterstützte Features
            </Typography>
            <Grid container spacing={1}>
              {Object.entries(gpuInfo.capabilities).map(([capability, supported]) => (
                <Grid item key={capability}>
                  <Chip
                    icon={getCapabilityIcon(capability)}
                    label={capability.toUpperCase()}
                    color={supported ? 'success' : 'default'}
                    variant={supported ? 'filled' : 'outlined'}
                    size="small"
                  />
                </Grid>
              ))}
            </Grid>
          </Box>
        )}

        {/* Versionen */}
        {(gpuInfo?.driver_version || gpuInfo?.cuda_version) && (
          <Box>
            <Typography variant="subtitle2" gutterBottom>
              Versionen
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {gpuInfo.driver_version && (
                <>Treiber: {gpuInfo.driver_version}</>
              )}
              {gpuInfo.driver_version && gpuInfo.cuda_version && <br />}
              {gpuInfo.cuda_version && (
                <>CUDA: {gpuInfo.cuda_version}</>
              )}
            </Typography>
          </Box>
        )}

        {/* Warnung falls keine GPU */}
        {!gpuInfo?.available && (
          <Alert severity="warning" sx={{ mt: 2 }}>
            <Typography variant="body2">
              Keine GPU-Beschleunigung verfügbar. Container werden mit Software-Rendering ausgeführt.
            </Typography>
          </Alert>
        )}

        {/* Erfolg-Meldung */}
        {gpuInfo?.available && (
          <Alert severity="success" sx={{ mt: 2 }}>
            <Typography variant="body2">
              GPU-Beschleunigung ist verfügbar! Container unterstützen Hardware-beschleunigtes Gaming und Rendering.
            </Typography>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
};

export default GPUStatus; 