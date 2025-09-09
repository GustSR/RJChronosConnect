import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  Grid,
  Paper,
  Button,
  Chip,
  Alert,
  InputAdornment,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Stack,
  LinearProgress,
} from '@mui/material';
import {
  Add,
  Refresh,
  Search,
  FilterList,
  TrendingUp,
  Schedule,
  CheckCircle,
  Warning,
} from '@mui/icons-material';
import useTitle from 'hooks/useTitle';
import AnimatedCard from '../components/common/AnimatedCard';
import PendingOnuCard from '../components/common/PendingOnuCard';
import { useProvisioning } from '../contexts/ProvisioningContext';
// import { PendingONU } from 'types/provisioning';

const Provisioning: React.FC = () => {
  useTitle('Provisionamento - RJ Chronos');

  const navigate = useNavigate();
  const {
    pendingONUs,
    loading,
    error,
    provisionONU,
    rejectONU,
    refreshPendingONUs,
  } = useProvisioning();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [oltFilter, setOltFilter] = useState<string>('all');

  // Filtrar ONUs baseado nos critérios
  const filteredONUs = pendingONUs.filter((onu) => {
    const matchesSearch =
      onu.serialNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      onu.onuType.toLowerCase().includes(searchTerm.toLowerCase()) ||
      onu.oltName.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'all' || onu.status === statusFilter;
    const matchesOlt = oltFilter === 'all' || onu.oltName === oltFilter;

    return matchesSearch && matchesStatus && matchesOlt;
  });

  // Estatísticas
  const stats = {
    total: pendingONUs.length,
    pending: pendingONUs.filter((onu) => onu.status === 'pending').length,
    authorized: pendingONUs.filter((onu) => onu.status === 'authorized').length,
    failed: pendingONUs.filter((onu) => onu.status === 'failed').length,
  };

  // Obter OLTs únicas para filtro
  const uniqueOlts = [...new Set(pendingONUs.map((onu) => onu.oltName))];

  const handleProvision = async (onuId: string) => {
    try {
      // Provisionar com dados básicos - o resto será configurado na tela de configuração
      const success = await provisionONU(onuId, {
        client_name: `Cliente ${onuId.slice(-6)}`, // Nome temporário baseado no ID
        client_address: 'Endereço a ser configurado',
        service_profile: 'default',
        vlan_id: 100,
        wan_mode: 'dhcp',
      });

      if (success) {
        // Redirecionar imediatamente para configuração
        navigate(`/clientes/${onuId}/configurar`);
      } else {
        alert('Erro ao autorizar ONU. Tente novamente.');
      }
    } catch (error) {
      console.error('Erro no provisionamento:', error);
      alert('Erro ao processar provisionamento');
    }
  };

  const handleReject = async (onuId: string) => {
    const reason =
      prompt('Motivo da rejeição (opcional):') ||
      'Rejeitada pelo administrador';

    if (!confirm('Tem certeza que deseja rejeitar esta ONU?')) {
      return;
    }

    try {
      const success = await rejectONU(onuId, reason);

      if (success) {
        alert('ONU rejeitada com sucesso');
      } else {
        alert('Erro ao rejeitar ONU. Tente novamente.');
      }
    } catch (error) {
      console.error('Erro na rejeição:', error);
      alert('Erro ao processar rejeição');
    }
  };

  const handleRefresh = async () => {
    await refreshPendingONUs();
  };

  return (
    <Box sx={{ bgcolor: '#fafafa', minHeight: '100vh', py: 3 }}>
      <Container maxWidth="xl">
        {/* Header */}
        <Box sx={{ mb: 4 }}>
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              mb: 2,
            }}
          >
            <Box>
              <Typography
                variant="h4"
                fontWeight="700"
                fontSize="28px"
                color="#1a1a1a"
              >
                Provisionamento
              </Typography>
              <Typography
                variant="body1"
                color="text.secondary"
                fontSize="16px"
              >
                Gerencie ONUs/ONTs pendentes de autorização na rede
              </Typography>
            </Box>

            <Stack direction="row" spacing={2}>
              <Button
                variant="outlined"
                startIcon={<Refresh />}
                onClick={handleRefresh}
                sx={{
                  borderRadius: 3,
                  textTransform: 'none',
                  fontWeight: 500,
                }}
              >
                Atualizar
              </Button>
              <Button
                variant="contained"
                startIcon={<Add />}
                sx={{
                  borderRadius: 3,
                  textTransform: 'none',
                  fontWeight: 600,
                  background: 'linear-gradient(135deg, #6366f1, #5855eb)',
                  '&:hover': {
                    background: 'linear-gradient(135deg, #5855eb, #4f46e5)',
                  },
                }}
              >
                Adicionar Manual
              </Button>
            </Stack>
          </Box>

          {/* Toolbar de Filtros */}
          <AnimatedCard delay={100} sx={{ p: 2, borderRadius: 3, mb: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <FilterList sx={{ mr: 1, color: '#6b7280', fontSize: 20 }} />
              <Typography variant="body1" fontWeight="600" sx={{ mr: 3 }}>
                Filtros
              </Typography>
              <Chip
                label={`${filteredONUs.length} resultados`}
                color="primary"
                variant="outlined"
                size="small"
                sx={{ fontWeight: 600 }}
              />
            </Box>

            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} md={5}>
                <TextField
                  fullWidth
                  size="small"
                  placeholder="Buscar por S/N, modelo ou OLT..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Search sx={{ color: '#6b7280' }} />
                      </InputAdornment>
                    ),
                  }}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 3,
                    },
                  }}
                />
              </Grid>

              <Grid item xs={12} md={3}>
                <FormControl fullWidth size="small">
                  <InputLabel>Status</InputLabel>
                  <Select
                    value={statusFilter}
                    label="Status"
                    onChange={(e) => setStatusFilter(e.target.value)}
                    sx={{ borderRadius: 3 }}
                  >
                    <MenuItem value="all">Todos</MenuItem>
                    <MenuItem value="pending">Pendente</MenuItem>
                    <MenuItem value="authorized">Autorizada</MenuItem>
                    <MenuItem value="failed">Rejeitada</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} md={4}>
                <FormControl fullWidth size="small">
                  <InputLabel>OLT</InputLabel>
                  <Select
                    value={oltFilter}
                    label="OLT"
                    onChange={(e) => setOltFilter(e.target.value)}
                    sx={{ borderRadius: 3 }}
                  >
                    <MenuItem value="all">Todas</MenuItem>
                    {uniqueOlts.map((olt) => (
                      <MenuItem key={olt} value={olt}>
                        {olt}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
          </AnimatedCard>

          {/* Indicadores de Loading e Error */}
          {loading && (
            <AnimatedCard delay={150} sx={{ mb: 3 }}>
              <Alert
                severity="info"
                icon={<LinearProgress sx={{ width: 20, mr: 1 }} />}
              >
                Carregando ONUs pendentes do GenieACS...
              </Alert>
            </AnimatedCard>
          )}

          {error && (
            <AnimatedCard delay={150} sx={{ mb: 3 }}>
              <Alert severity="error" sx={{ borderRadius: 3 }}>
                {error}
              </Alert>
            </AnimatedCard>
          )}

          {/* Estatísticas */}
          <Grid container spacing={3} sx={{ mb: 3 }}>
            <Grid item xs={12} sm={6} md={3}>
              <AnimatedCard delay={200}>
                <Paper sx={{ p: 3, borderRadius: 3, textAlign: 'center' }}>
                  <TrendingUp sx={{ fontSize: 40, color: '#6366f1', mb: 1 }} />
                  <Typography variant="h4" fontWeight="700" color="#1a1a1a">
                    {stats.total}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Total Descobertas
                  </Typography>
                </Paper>
              </AnimatedCard>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <AnimatedCard delay={300}>
                <Paper sx={{ p: 3, borderRadius: 3, textAlign: 'center' }}>
                  <Schedule sx={{ fontSize: 40, color: '#f59e0b', mb: 1 }} />
                  <Typography variant="h4" fontWeight="700" color="#1a1a1a">
                    {stats.pending}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Aguardando
                  </Typography>
                </Paper>
              </AnimatedCard>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <AnimatedCard delay={400}>
                <Paper sx={{ p: 3, borderRadius: 3, textAlign: 'center' }}>
                  <CheckCircle sx={{ fontSize: 40, color: '#10b981', mb: 1 }} />
                  <Typography variant="h4" fontWeight="700" color="#1a1a1a">
                    {stats.authorized}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Autorizadas
                  </Typography>
                </Paper>
              </AnimatedCard>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <AnimatedCard delay={500}>
                <Paper sx={{ p: 3, borderRadius: 3, textAlign: 'center' }}>
                  <Warning sx={{ fontSize: 40, color: '#ef4444', mb: 1 }} />
                  <Typography variant="h4" fontWeight="700" color="#1a1a1a">
                    {stats.failed}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Rejeitadas
                  </Typography>
                </Paper>
              </AnimatedCard>
            </Grid>
          </Grid>
        </Box>

        {/* Lista de ONUs Pendentes */}
        {filteredONUs.length === 0 ? (
          <AnimatedCard delay={600}>
            <Alert
              severity="info"
              sx={{
                borderRadius: 3,
                fontSize: '16px',
                py: 2,
              }}
            >
              {searchTerm || statusFilter !== 'all' || oltFilter !== 'all'
                ? 'Nenhuma ONU encontrada com os filtros aplicados.'
                : 'Nenhuma ONU pendente de autorização no momento.'}
            </Alert>
          </AnimatedCard>
        ) : (
          <Grid container spacing={3}>
            {filteredONUs.map((onu, index) => (
              <Grid item xs={12} md={6} lg={4} key={onu.id}>
                <AnimatedCard delay={600 + index * 100}>
                  <PendingOnuCard
                    onu={onu}
                    onProvision={handleProvision}
                    onReject={handleReject}
                  />
                </AnimatedCard>
              </Grid>
            ))}
          </Grid>
        )}
      </Container>
    </Box>
  );
};

export default Provisioning;
