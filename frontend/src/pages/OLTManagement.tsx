import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Button,
  Card,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  IconButton,
  Typography,
  Alert,
  Skeleton,
  Grid,
} from '@mui/material';
import {
  Add as AddIcon,
  Visibility as ViewIcon,
  Delete as DeleteIcon,
  DeviceHub as DeviceHubIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { H3, H6 } from 'components/Typography';
import { genieacsApi } from 'services/genieacsApi';
import { OLT } from 'services/types';
import FlexBox from 'components/FlexBox';
import useTitle from 'hooks/useTitle';
import AnimatedCard from 'components/common/AnimatedCard';

const OLTManagement: React.FC = () => {
  const navigate = useNavigate();
  const [olts, setOlts] = useState<OLT[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useTitle('Gerenciamento de OLTs - RJ Chronos');

  useEffect(() => {
    loadOLTs();
  }, []);

  // Simular loading inicial para evitar blink
  const [initialLoad, setInitialLoad] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setInitialLoad(false), 50);
    return () => clearTimeout(timer);
  }, []);

  const loadOLTs = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await genieacsApi.getOLTs();
      setOlts(data);
    } catch (err) {
      setError('Erro ao carregar lista de OLTs');
      console.error('Erro ao carregar OLTs:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteOLT = async (_oltId: string) => {
    if (window.confirm('Tem certeza que deseja excluir esta OLT?')) {
      try {
        // TODO: Implementar API de delete
        // await genieacsApi.deleteOLT(oltId);
        await loadOLTs();
      } catch (err) {
        console.error('Erro ao excluir OLT:', err);
        // TODO: Mostrar toast de erro
      }
    }
  };

  const getStatusChip = (status: string) => {
    const color = status === 'online' ? 'success' : 'error';
    return (
      <Chip
        label={status === 'online' ? 'Online' : 'Offline'}
        color={color}
        size="small"
      />
    );
  };

  // Loading interno sem bloquear layout principal

  return (
    <Container maxWidth="xl" sx={{ py: 4, px: 2 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" fontWeight="600" sx={{ mb: 1 }}>
          Gerenciamento de OLTs
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Gerencie suas Optical Line Terminals
        </Typography>
        <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => navigate('/olts/add')}
          >
            Adicionar OLT
          </Button>
        </Box>
      </Box>

      {/* Estatísticas rápidas */}
      <Grid container spacing={3} mb={3}>
        <Grid item xs={12} sm={6} md={3}>
          <AnimatedCard delay={100} sx={{ p: 2, textAlign: 'center' }}>
            <DeviceHubIcon color="primary" sx={{ fontSize: 40, mb: 1 }} />
            <H6>Total de OLTs</H6>
            <Typography variant="h4" color="primary">
              {olts.length}
            </Typography>
          </AnimatedCard>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <AnimatedCard delay={200} sx={{ p: 2, textAlign: 'center' }}>
            <DeviceHubIcon color="success" sx={{ fontSize: 40, mb: 1 }} />
            <H6>OLTs Online</H6>
            <Typography variant="h4" color="success.main">
              {olts.filter((olt) => olt.status === 'online').length}
            </Typography>
          </AnimatedCard>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <AnimatedCard delay={300} sx={{ p: 2, textAlign: 'center' }}>
            <DeviceHubIcon color="error" sx={{ fontSize: 40, mb: 1 }} />
            <H6>OLTs Offline</H6>
            <Typography variant="h4" color="error.main">
              {olts.filter((olt) => olt.status !== 'online').length}
            </Typography>
          </AnimatedCard>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <AnimatedCard delay={400} sx={{ p: 2, textAlign: 'center' }}>
            <DeviceHubIcon color="info" sx={{ fontSize: 40, mb: 1 }} />
            <H6>Taxa de Disponibilidade</H6>
            <Typography variant="h4" color="info.main">
              {olts.length > 0
                ? Math.round(
                    (olts.filter((olt) => olt.status === 'online').length /
                      olts.length) *
                      100
                  )
                : 0}
              %
            </Typography>
          </AnimatedCard>
        </Grid>
      </Grid>

      {/* Error Alert */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
          <Button
            color="inherit"
            size="small"
            onClick={loadOLTs}
            sx={{ ml: 2 }}
          >
            Tentar novamente
          </Button>
        </Alert>
      )}

      {/* OLTs Table */}
      <AnimatedCard delay={500} sx={{ borderRadius: 3, boxShadow: 2, mt: 2 }}>
        <Box sx={{ p: 0 }}>
          {loading ? (
            <Box p={2}>
              {[...Array(5)].map((_, index) => (
                <Box key={index} mb={2}>
                  <Skeleton
                    variant="rectangular"
                    height={60}
                    sx={{ borderRadius: 1 }}
                  />
                </Box>
              ))}
            </Box>
          ) : (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>ID</TableCell>
                    <TableCell>Nome</TableCell>
                    <TableCell>IP da OLT</TableCell>
                    <TableCell>Porta Telnet/SSH</TableCell>
                    <TableCell>IPTV</TableCell>
                    <TableCell>Hardware Version</TableCell>
                    <TableCell>Software Version</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell align="center">Ações</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {olts.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={9} align="center">
                        <Box py={4}>
                          <DeviceHubIcon
                            sx={{ fontSize: 60, color: 'grey.400', mb: 2 }}
                          />
                          <Typography color="text.secondary">
                            Nenhuma OLT encontrada
                          </Typography>
                          <Button
                            variant="outlined"
                            startIcon={<AddIcon />}
                            onClick={() => navigate('/olts/add')}
                            sx={{ mt: 2 }}
                          >
                            Adicionar primeira OLT
                          </Button>
                        </Box>
                      </TableCell>
                    </TableRow>
                  ) : (
                    olts.map((olt, index) => (
                      <TableRow key={olt.id} hover>
                        <TableCell>{index + 1}</TableCell>
                        <TableCell>
                          <Typography fontWeight={500}>
                            {olt.serial_number}
                          </Typography>
                        </TableCell>
                        <TableCell>{olt.ip_address}</TableCell>
                        <TableCell>23</TableCell>
                        <TableCell>
                          <Chip
                            label="Desabilitado"
                            color="default"
                            size="small"
                          />
                        </TableCell>
                        <TableCell>{olt.hardware_version || 'N/A'}</TableCell>
                        <TableCell>{olt.software_version || 'N/A'}</TableCell>
                        <TableCell>{getStatusChip(olt.status)}</TableCell>
                        <TableCell align="center">
                          <IconButton
                            color="primary"
                            onClick={() => navigate(`/olts/${olt.id}`)}
                            title="Ver detalhes"
                          >
                            <ViewIcon />
                          </IconButton>
                          <IconButton
                            color="error"
                            onClick={() => handleDeleteOLT(olt.id)}
                            title="Excluir OLT"
                          >
                            <DeleteIcon />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Box>
      </AnimatedCard>
    </Container>
  );
};

export default OLTManagement;
