import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Grid,
  Card,
  CardContent,
  Box,
  Chip,
  IconButton,
  Stack,
  Tooltip,
  Alert,
  TextField,
  InputAdornment,
} from '@mui/material';
import {
  Close,
  Search,
  Router,
  SignalCellular4Bar,
  SignalCellular2Bar,
  SignalCellular1Bar,
  SignalCellularOff,
  CheckCircle,
  Warning,
  Error,
  DeviceHub,
  WifiTethering,
} from '@mui/icons-material';
import { PendingONU } from '../../lib/provisioningData';

interface AddOnuModalProps {
  open: boolean;
  onClose: () => void;
  clienteNome: string;
  pendingONUs: PendingONU[];
  onProvisionONU: (onuId: string) => void;
}

const AddOnuModal: React.FC<AddOnuModalProps> = ({
  open,
  onClose,
  clienteNome,
  pendingONUs,
  onProvisionONU,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedONU, setSelectedONU] = useState<string | null>(null);

  // Filtrar ONUs baseado no termo de pesquisa
  const filteredONUs = pendingONUs.filter((onu) =>
    onu.serialNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
    onu.onuType.toLowerCase().includes(searchTerm.toLowerCase()) ||
    onu.oltName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getSignalIcon = (rxPower: number | null) => {
    if (!rxPower) return <SignalCellularOff color="disabled" />;
    if (rxPower >= -15) return <SignalCellular4Bar color="success" />;
    if (rxPower >= -20) return <SignalCellular2Bar color="success" />;
    if (rxPower >= -25) return <SignalCellular1Bar color="warning" />;
    return <SignalCellularOff color="error" />;
  };

  const getSignalColor = (rxPower: number | null) => {
    if (!rxPower) return '#6b7280';
    if (rxPower >= -15) return '#10b981';
    if (rxPower >= -20) return '#10b981';
    if (rxPower >= -25) return '#f59e0b';
    return '#ef4444';
  };

  const getSignalLabel = (rxPower: number | null) => {
    if (!rxPower) return 'N/A';
    if (rxPower >= -15) return 'Excelente';
    if (rxPower >= -20) return 'Bom';
    if (rxPower >= -25) return 'Regular';
    return 'Fraco';
  };

  const getOnuIcon = (onuType: string) => {
    const type = onuType.toLowerCase();
    if (type.includes('zte')) return '🔷';
    if (type.includes('huawei')) return '🔴';
    if (type.includes('fiberhome')) return '🟢';
    if (type.includes('nokia')) return '🔵';
    return '📡';
  };

  const handleProvision = () => {
    if (selectedONU) {
      onProvisionONU(selectedONU);
      setSelectedONU(null);
      setSearchTerm('');
      onClose();
    }
  };

  const handleClose = () => {
    setSelectedONU(null);
    setSearchTerm('');
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 4,
          maxHeight: '90vh',
        },
      }}
    >
      <DialogTitle
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          pb: 2,
        }}
      >
        <Box>
          <Typography variant="h5" fontWeight="600">
            Adicionar ONU/ONT
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Selecione uma ONU/ONT para provisionar para <strong>{clienteNome}</strong>
          </Typography>
        </Box>
        <IconButton onClick={handleClose} size="small">
          <Close />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ px: 3 }}>
        {/* Campo de Pesquisa */}
        <TextField
          fullWidth
          size="small"
          label="Pesquisar equipamento"
          placeholder="Serial Number, Modelo, OLT..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Search />
              </InputAdornment>
            ),
          }}
          sx={{ 
            mb: 3,
            '& .MuiOutlinedInput-root': { borderRadius: 2 }
          }}
        />

        {filteredONUs.length === 0 ? (
          <Alert severity="info" sx={{ textAlign: 'center' }}>
            {searchTerm ? 
              `Nenhum equipamento encontrado para "${searchTerm}"` :
              'Nenhum equipamento disponível para provisionamento'
            }
          </Alert>
        ) : (
          <Grid container spacing={2} sx={{ maxHeight: '400px', overflowY: 'auto' }}>
            {filteredONUs.map((onu) => (
              <Grid item xs={12} key={onu.id}>
                <Card
                  sx={{
                    borderRadius: 3,
                    border: selectedONU === onu.id ? 2 : 1,
                    borderColor: selectedONU === onu.id ? 'primary.main' : 'divider',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    '&:hover': {
                      borderColor: 'primary.main',
                      boxShadow: '0 4px 12px rgba(99, 102, 241, 0.15)',
                    },
                  }}
                  onClick={() => setSelectedONU(onu.id)}
                >
                  <CardContent sx={{ p: 2.5 }}>
                    <Grid container spacing={2} alignItems="center">
                      {/* Modelo e Serial */}
                      <Grid item xs={12} md={4}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                          <Box
                            sx={{
                              fontSize: '20px',
                              width: 36,
                              height: 36,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              bgcolor: 'primary.light',
                              borderRadius: 2,
                            }}
                          >
                            {getOnuIcon(onu.onuType)}
                          </Box>
                          <Box>
                            <Typography variant="body1" fontWeight="600">
                              {onu.onuType}
                            </Typography>
                            <Typography
                              variant="body2"
                              color="text.secondary"
                              fontFamily="monospace"
                              fontSize="11px"
                            >
                              S/N: {onu.serialNumber}
                            </Typography>
                          </Box>
                        </Box>
                      </Grid>

                      {/* OLT e Localização */}
                      <Grid item xs={12} md={4}>
                        <Stack spacing={1}>
                          <Tooltip title="OLT">
                            <Chip
                              icon={<DeviceHub fontSize="small" />}
                              label={onu.oltName}
                              size="small"
                              variant="outlined"
                              sx={{ fontSize: '11px', height: 24 }}
                            />
                          </Tooltip>
                          <Tooltip title={`Board ${onu.board}, Port ${onu.port}`}>
                            <Chip
                              icon={<WifiTethering fontSize="small" />}
                              label={`${onu.board}/${onu.port}`}
                              size="small"
                              variant="outlined"
                              sx={{ fontSize: '11px', height: 24 }}
                            />
                          </Tooltip>
                        </Stack>
                      </Grid>

                      {/* Sinal e Status */}
                      <Grid item xs={12} md={4}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Tooltip title={getSignalLabel(onu.rxPower)}>
                            {getSignalIcon(onu.rxPower)}
                          </Tooltip>
                          <Box>
                            <Typography
                              variant="body2"
                              fontWeight="600"
                              sx={{ color: getSignalColor(onu.rxPower) }}
                            >
                              {onu.rxPower ? `${onu.rxPower} dBm` : 'N/A'}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {getSignalLabel(onu.rxPower)}
                            </Typography>
                          </Box>
                          {selectedONU === onu.id && (
                            <CheckCircle color="primary" sx={{ ml: 'auto' }} />
                          )}
                        </Box>
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={handleClose} variant="outlined" sx={{ borderRadius: 2 }}>
          Cancelar
        </Button>
        <Button
          onClick={handleProvision}
          variant="contained"
          disabled={!selectedONU}
          sx={{
            borderRadius: 2,
            background: 'linear-gradient(135deg, #6366f1, #5855eb)',
            '&:hover': {
              background: 'linear-gradient(135deg, #5855eb, #4f46e5)',
            },
          }}
        >
          Provisionar para Cliente
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AddOnuModal;