import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Button,
  Card,
  Typography,
  Grid,
  Chip,
  IconButton,
  Tab,
  Tabs,
  Table,
  TableBody,
  TableCell,
  TableRow,
  Alert,
  Skeleton,
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Edit as EditIcon,
  History as HistoryIcon,
  Terminal as TerminalIcon,
  Backup as BackupIcon,
  DeviceHub as DeviceHubIcon,
  Schedule as ScheduleIcon,
} from '@mui/icons-material';
import { useNavigate, useParams } from 'react-router-dom';
import { H3, H5, H6 } from 'components/Typography';
import FlexBox from 'components/FlexBox';
import useTitle from 'hooks/useTitle';
import AnimatedCard from 'components/common/AnimatedCard';
import { genieacsApi } from 'api/genieacsApi';
import { OLT } from 'api/types';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`simple-tabpanel-${index}`}
      aria-labelledby={`simple-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

const OLTDetails: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [olt, setOlt] = useState<OLT | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tabValue, setTabValue] = useState(0);
  const uptime = '124 days, 23:11, 35°C';

  useTitle('Detalhes da OLT - RJ Chronos');

  useEffect(() => {
    if (id) {
      loadOLTDetails(id);
    }
  }, [id]);

  // Evitar blink inicial
  const [initialLoad, setInitialLoad] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setInitialLoad(false), 50);
    return () => clearTimeout(timer);
  }, []);

  const loadOLTDetails = async (oltId: string) => {
    try {
      setLoading(true);
      setError(null);

      // TODO: Implementar API para buscar detalhes específicos da OLT
      const olts = await genieacsApi.getOLTs();
      const foundOlt = olts.find((o) => o.id === oltId);

      if (foundOlt) {
        setOlt(foundOlt);
      } else {
        setError('OLT não encontrada');
      }
    } catch (err) {
      setError('Erro ao carregar detalhes da OLT');
      console.error('Erro:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
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

  // Renderizar sempre o layout principal

  return (
    <Container maxWidth="xl" sx={{ py: 4, px: 2 }}>
      {/* Loading State */}
      {loading && (
        <AnimatedCard delay={0}>
          <Box p={3}>
            <FlexBox alignItems="center" mb={3}>
              <IconButton onClick={() => navigate('/olts')} sx={{ mr: 2 }}>
                <ArrowBackIcon />
              </IconButton>
              <Skeleton variant="text" width={300} height={40} />
            </FlexBox>
            <Skeleton
              variant="rectangular"
              height={200}
              sx={{ borderRadius: 1 }}
            />
          </Box>
        </AnimatedCard>
      )}

      {/* Error State */}
      {error && !olt && !loading && (
        <AnimatedCard delay={100}>
          <Box p={3}>
            <FlexBox alignItems="center" mb={3}>
              <IconButton onClick={() => navigate('/olts')} sx={{ mr: 2 }}>
                <ArrowBackIcon />
              </IconButton>
              <H3>Detalhes da OLT</H3>
            </FlexBox>
            <Alert severity="error">{error || 'OLT não encontrada'}</Alert>
          </Box>
        </AnimatedCard>
      )}

      {/* Main Content - Render when we have data or when not loading */}
      {!loading && olt && (
        <>
          {/* Header */}
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 4 }}>
            <IconButton
              onClick={() => navigate('/olts')}
              sx={{ mr: 2, color: 'primary.main' }}
            >
              <ArrowBackIcon />
            </IconButton>
            <Box sx={{ flexGrow: 1 }}>
              <Typography variant="h4" fontWeight="700" sx={{ mb: 1 }}>
                {olt.serial_number}
              </Typography>
              <Typography variant="body1" color="text.secondary">
                {olt.ip_address}
              </Typography>
            </Box>
            <Button
              variant="outlined"
              startIcon={<EditIcon />}
              onClick={() => navigate(`/olts/${id}/edit`)}
            >
              Editar OLT
            </Button>
          </Box>

          {/* Status Card */}
          <AnimatedCard delay={100} sx={{ mb: 3 }}>
            <Box p={3}>
              <Grid container spacing={3} alignItems="center">
                <Grid item>
                  <Box
                    component="img"
                    src="/static/brand-logo/huawei-logo.png"
                    alt="Huawei"
                    sx={{
                      width: 100,
                      height: 60,
                      objectFit: 'contain',
                    }}
                    onError={() => {
                      // Hide the image and show the icon fallback
                    }}
                  />
                  <DeviceHubIcon
                    sx={{ fontSize: 60, display: 'none', color: 'grey.400' }}
                  />
                </Grid>
                <Grid item flexGrow={1}>
                  <FlexBox alignItems="center" gap={2} mb={1}>
                    <ScheduleIcon color="action" />
                    <Typography>
                      <strong>Uptime:</strong> {uptime}
                    </Typography>
                  </FlexBox>
                  <FlexBox alignItems="center" gap={1}>
                    <Typography variant="body2" color="text.secondary">
                      Status:
                    </Typography>
                    {getStatusChip(olt.status)}
                  </FlexBox>
                </Grid>
              </Grid>
            </Box>
          </AnimatedCard>

          {/* Tabs */}
          <AnimatedCard delay={200}>
            <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
              <Tabs value={tabValue} onChange={handleTabChange}>
                <Tab label="Detalhes da OLT" />
                <Tab label="Placas da OLT" />
                <Tab label="Portas PON" />
                <Tab label="Uplink" />
                <Tab label="VLANs" />
                <Tab label="IPs de Gerenciamento de ONU" />
                <Tab label="ACLs Remotas" />
                <Tab label="Perfis VoIP" />
                <Tab label="Avançado" />
              </Tabs>
            </Box>

            <TabPanel value={tabValue} index={0}>
              {/* Detalhes da OLT */}
              <FlexBox
                justifyContent="space-between"
                alignItems="center"
                mb={3}
              >
                <H5>Configurações da OLT</H5>
                <FlexBox gap={1}>
                  <Button
                    variant="outlined"
                    startIcon={<EditIcon />}
                    size="small"
                  >
                    Editar configurações da OLT
                  </Button>
                  <Button
                    variant="outlined"
                    startIcon={<HistoryIcon />}
                    size="small"
                  >
                    Ver histórico
                  </Button>
                  <Button
                    variant="outlined"
                    startIcon={<TerminalIcon />}
                    size="small"
                    color="success"
                  >
                    _Cli
                  </Button>
                  <Button
                    variant="outlined"
                    startIcon={<BackupIcon />}
                    size="small"
                  >
                    Backup de configurações
                  </Button>
                </FlexBox>
              </FlexBox>

              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <DeviceHubIcon sx={{ mr: 1, fontSize: 20 }} />
                    <Typography variant="h6">Informações Técnicas</Typography>
                  </Box>

                  {/* Settings definition moved here to ensure olt exists */}
                  {(() => {
                    const oltSettings = [
                      { label: 'Name', value: olt.serial_number },
                      { label: 'OLT IP', value: olt.ip_address },
                      { label: 'Reachable via VPN tunnel', value: 'yes' },
                      { label: 'Telnet TCP port', value: '23' },
                      { label: 'OLT telnet username', value: '**********' },
                      { label: 'OLT telnet password', value: '**********' },
                      {
                        label: 'SNMP read-only community',
                        value: '**********',
                      },
                      {
                        label: 'SNMP read-write community',
                        value: '**********',
                      },
                      { label: 'SNMP UDP port', value: '161' },
                      { label: 'IPTV module', value: 'disabled' },
                      {
                        label: 'OLT hardware version',
                        value: olt.hardware_version || 'Huawei-MA5800-X2',
                      },
                      {
                        label: 'OLT software version',
                        value: olt.software_version || 'R019',
                      },
                      { label: 'Supported PON types', value: 'GPON' },
                    ];

                    return (
                      <Table size="small">
                        <TableBody>
                          {oltSettings.map((setting, index) => (
                            <TableRow key={index}>
                              <TableCell
                                component="th"
                                scope="row"
                                sx={{ fontWeight: 500, width: '40%' }}
                              >
                                {setting.label}
                              </TableCell>
                              <TableCell>{setting.value}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    );
                  })()}
                </Grid>
              </Grid>
            </TabPanel>

            <TabPanel value={tabValue} index={1}>
              <H6>Placas da OLT</H6>
              <Typography color="text.secondary">
                Em desenvolvimento - Informações sobre as placas instaladas na
                OLT
              </Typography>
            </TabPanel>

            <TabPanel value={tabValue} index={2}>
              <H6>Portas PON</H6>
              <Typography color="text.secondary">
                Em desenvolvimento - Configuração das portas PON
              </Typography>
            </TabPanel>

            <TabPanel value={tabValue} index={3}>
              <H6>Uplink</H6>
              <Typography color="text.secondary">
                Em desenvolvimento - Configuração do uplink
              </Typography>
            </TabPanel>

            <TabPanel value={tabValue} index={4}>
              <H6>VLANs</H6>
              <Typography color="text.secondary">
                Em desenvolvimento - Configuração de VLANs
              </Typography>
            </TabPanel>

            <TabPanel value={tabValue} index={5}>
              <H6>IPs de Gerenciamento de ONU</H6>
              <Typography color="text.secondary">
                Em desenvolvimento - Configuração de IPs de gerenciamento
              </Typography>
            </TabPanel>

            <TabPanel value={tabValue} index={6}>
              <H6>ACLs Remotas</H6>
              <Typography color="text.secondary">
                Em desenvolvimento - Configuração de ACLs
              </Typography>
            </TabPanel>

            <TabPanel value={tabValue} index={7}>
              <H6>Perfis VoIP</H6>
              <Typography color="text.secondary">
                Em desenvolvimento - Configuração de perfis VoIP
              </Typography>
            </TabPanel>

            <TabPanel value={tabValue} index={8}>
              <H6>Configurações Avançadas</H6>
              <Typography color="text.secondary">
                Em desenvolvimento - Configurações avançadas da OLT
              </Typography>
            </TabPanel>
          </AnimatedCard>
        </>
      )}
    </Container>
  );
};

export default OLTDetails;
