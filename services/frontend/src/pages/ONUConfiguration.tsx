import type { ConfigurationTabId, ONUDetails } from '@features/onu-configuration';
import { connectedHosts, DeviceLogsPanel, GeneralPanel, HistoricoAlteracoesModal, historicoAlteracoes, HostsPanel, initialLanDhcpConfig, initialSecurityConfig, initialWifiNetworks, LanDhcpPanel, LanPortsPanel, menuItems, SecurityPanel, TroubleshootingPanel, WifiPanel } from '@features/onu-configuration';
import { useProvisioning } from '@features/onu-provisioning';
import { ArrowBack, RouterOutlined } from '@mui/icons-material';
import { Box, Card, CardContent, Container, Grid, IconButton, Link, Stack, Typography } from '@mui/material';
import { useTitle } from '@shared/lib/hooks';
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

export default function ONUConfiguration() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { provisionedONUs } = useProvisioning();

  useTitle('Configuração ONU');

  const [loading, setLoading] = useState(true);
  const [onuDetails, setOnuDetails] = useState<ONUDetails | null>(null);
  const [selectedMenuItem, setSelectedMenuItem] = useState<
    ConfigurationTabId | ''
  >('');
  const [historicoModalOpen, setHistoricoModalOpen] = useState(false);

  const [selectedWifiLan, setSelectedWifiLan] = useState<string>('');
  const [selectedTroubleshootingTest, setSelectedTroubleshootingTest] =
    useState<string>('');

  const [lanDhcpConfig, setLanDhcpConfig] = useState(initialLanDhcpConfig);
  const [originalLanDhcpConfig, setOriginalLanDhcpConfig] =
    useState(initialLanDhcpConfig);

  const [wifiNetworks, setWifiNetworks] = useState(initialWifiNetworks);
  const [originalWifiNetworks, setOriginalWifiNetworks] =
    useState(initialWifiNetworks);

  const [securityConfig, setSecurityConfig] = useState(initialSecurityConfig);
  const [originalSecurityConfig, setOriginalSecurityConfig] =
    useState(initialSecurityConfig);

  useEffect(() => {
    if (selectedMenuItem !== 'wifi' && selectedWifiLan) {
      setSelectedWifiLan('');
    }
  }, [selectedMenuItem, selectedWifiLan]);

  useEffect(() => {
    if (selectedMenuItem !== 'troubleshooting' && selectedTroubleshootingTest) {
      setSelectedTroubleshootingTest('');
    }
  }, [selectedMenuItem, selectedTroubleshootingTest]);

  const hasLanDhcpChanges =
    JSON.stringify(lanDhcpConfig) !== JSON.stringify(originalLanDhcpConfig);

  const handleSaveLanDhcp = () => {
    setOriginalLanDhcpConfig({ ...lanDhcpConfig });
  };

  const hasWifiChanges = (networkKey: string) => {
    return (
      JSON.stringify(wifiNetworks[networkKey as keyof typeof wifiNetworks]) !==
      JSON.stringify(
        originalWifiNetworks[networkKey as keyof typeof originalWifiNetworks]
      )
    );
  };

  const handleSaveWifi = (networkKey: string) => {
    setOriginalWifiNetworks((prev) => ({
      ...prev,
      [networkKey]: {
        ...wifiNetworks[networkKey as keyof typeof wifiNetworks],
      },
    }));
  };

  const updateWifiNetwork = (networkKey: string, field: string, value: any) => {
    setWifiNetworks((prev) => ({
      ...prev,
      [networkKey]: {
        ...prev[networkKey as keyof typeof prev],
        [field]: value,
      },
    }));
  };

  const hasSecurityChanges =
    JSON.stringify(securityConfig) !== JSON.stringify(originalSecurityConfig);

  const handleSaveSecurity = () => {
    setOriginalSecurityConfig({ ...securityConfig });
  };

  useEffect(() => {
    const loadONUData = async () => {
      setLoading(true);

      await new Promise((resolve) => setTimeout(resolve, 1000));

      const onu = provisionedONUs.find((item) => item.id === id);

      if (onu) {
        const onuData: ONUDetails = {
          id: onu.id,
          serialNumber: onu.serialNumber,
          model: onu.onuType,
          customerName: onu.clientName,
          oltName: onu.oltName,
          board: onu.board.toString(),
          port: onu.port.toString(),
          status: onu.status,
          authorizedAt: onu.authorizedAt,
          ip: '192.168.2.1',
          temperature: 45,
        };

        setOnuDetails(onuData);
      }

      setLoading(false);
    };

    if (id) {
      loadONUData();
    }
  }, [id, provisionedONUs]);

  const renderContent = () => {
    if (!onuDetails) return null;

    switch (selectedMenuItem) {
      case 'general':
        return <GeneralPanel onuDetails={onuDetails} />;
      case 'lan-dhcp':
        return (
          <LanDhcpPanel
            config={lanDhcpConfig}
            setConfig={setLanDhcpConfig}
            hasChanges={hasLanDhcpChanges}
            onSave={handleSaveLanDhcp}
          />
        );
      case 'wifi':
        return (
          <WifiPanel
            wifiNetworks={wifiNetworks}
            selectedWifiLan={selectedWifiLan}
            setSelectedWifiLan={setSelectedWifiLan}
            updateWifiNetwork={updateWifiNetwork}
            hasWifiChanges={hasWifiChanges}
            onSaveWifi={handleSaveWifi}
          />
        );
      case 'hosts':
        return <HostsPanel hosts={connectedHosts} />;
      case 'lan-ports':
        return <LanPortsPanel />;
      case 'device-logs':
        return <DeviceLogsPanel />;
      case 'troubleshooting':
        return (
          <TroubleshootingPanel
            selectedTest={selectedTroubleshootingTest}
            setSelectedTest={setSelectedTroubleshootingTest}
          />
        );
      case 'security':
        return (
          <SecurityPanel
            config={securityConfig}
            setConfig={setSecurityConfig}
            hasChanges={hasSecurityChanges}
            onSave={handleSaveSecurity}
          />
        );
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
          <IconButton onClick={() => navigate('/clientes')} sx={{ mr: 2 }}>
            <ArrowBack />
          </IconButton>
          <Typography variant="h4" fontWeight="600">
            Carregando...
          </Typography>
        </Box>
      </Container>
    );
  }

  if (!onuDetails) {
    return (
      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
          <IconButton onClick={() => navigate('/clientes')} sx={{ mr: 2 }}>
            <ArrowBack />
          </IconButton>
          <Typography variant="h4" fontWeight="600">
            ONU não encontrada
          </Typography>
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ py: 4, px: 2 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 4 }}>
        <IconButton
          onClick={() => navigate('/clientes')}
          sx={{ mr: 2, color: 'primary.main' }}
        >
          <ArrowBack />
        </IconButton>
      </Box>

      <Grid
        container
        spacing={3}
        sx={{
          '& .MuiGrid-item': {
            transition: 'none !important',
            transform: 'none !important',
          },
          '& .MuiGrid-root': {
            transition: 'none !important',
            transform: 'none !important',
          },
        }}
      >
        <Grid item xs={12}>
          <Card
            sx={{
              boxShadow: 'none',
              border: '1px solid #e0e0e0',
              transition: 'none !important',
              '&:hover': {
                boxShadow: 'none !important',
                transform: 'none !important',
              },
            }}
          >
            <CardContent sx={{ p: 3 }}>
              <Grid container spacing={4}>
                <Grid item xs={12} md={6}>
                  <Box sx={{ mb: 3 }}>
                    <Typography
                      variant="h6"
                      fontWeight="600"
                      sx={{ mb: 2, display: 'flex', alignItems: 'center' }}
                    >
                      <RouterOutlined
                        sx={{ mr: 1, color: 'primary.main', fontSize: 24 }}
                      />
                      Equipamento: {onuDetails.serialNumber}
                    </Typography>
                  </Box>

                  <Stack spacing={1.5} sx={{ maxWidth: 300 }}>
                    <Box>
                      <Typography
                        variant="body2"
                        color="text.primary"
                        fontWeight="500"
                      >
                        Pertence a: {onuDetails.customerName}
                      </Typography>
                    </Box>
                    <Box>
                      <Typography
                        variant="body2"
                        color="text.primary"
                        fontWeight="500"
                      >
                        OLT: {onuDetails.oltName}
                      </Typography>
                    </Box>
                    <Box>
                      <Typography
                        variant="body2"
                        color="text.primary"
                        fontWeight="500"
                      >
                        SLOT: {onuDetails.board}
                      </Typography>
                    </Box>
                    <Box>
                      <Typography
                        variant="body2"
                        color="text.primary"
                        fontWeight="500"
                      >
                        PON: {onuDetails.port}
                      </Typography>
                    </Box>
                    <Box>
                      <Typography
                        variant="body2"
                        color="text.primary"
                        fontWeight="500"
                      >
                        TR-069
                      </Typography>
                    </Box>
                    <Box>
                      <Typography
                        variant="body2"
                        color="text.primary"
                        fontWeight="500"
                      >
                        SN: {onuDetails.serialNumber}
                      </Typography>
                    </Box>
                    <Box>
                      <Typography
                        variant="body2"
                        color="text.primary"
                        fontWeight="500"
                      >
                        Status: {onuDetails.status === 'online' ? 'Online' : 'Offline'}
                      </Typography>
                    </Box>
                    <Box>
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{ fontSize: '12px' }}
                      >
                        Autorizado em:{' '}
                        {new Date(onuDetails.authorizedAt).toLocaleDateString(
                          'pt-BR'
                        )}{' '}
                        às{' '}
                        {new Date(onuDetails.authorizedAt).toLocaleTimeString(
                          'pt-BR'
                        )}
                      </Typography>
                    </Box>
                    <Box>
                      <Link
                        href="#"
                        color="primary"
                        underline="hover"
                        sx={{
                          fontWeight: 500,
                          fontSize: '14px',
                          cursor: 'pointer',
                        }}
                        onClick={(e) => {
                          e.preventDefault();
                          setHistoricoModalOpen(true);
                        }}
                      >
                        Histórico de alterações
                      </Link>
                    </Box>
                  </Stack>
                </Grid>

                <Grid item xs={12} md={6}>
                  <Box
                    sx={{
                      height: 300,
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      position: 'relative',
                    }}
                  >
                    <Box
                      sx={{
                        width: 150,
                        height: 100,
                        border: '2px solid #ccc',
                        borderRadius: 2,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor: '#f5f5f5',
                        animation: 'rotate 4s linear infinite',
                        '@keyframes rotate': {
                          '0%': { transform: 'rotateY(0deg)' },
                          '100%': { transform: 'rotateY(360deg)' },
                        },
                      }}
                    >
                      <Box
                        sx={{
                          width: 100,
                          height: 25,
                          border: '1px solid #999',
                          borderRadius: 1,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          backgroundColor: '#000',
                        }}
                      >
                        <Typography
                          variant="caption"
                          sx={{
                            color: '#0088ff',
                            fontFamily: 'monospace',
                            fontWeight: 'bold',
                          }}
                        >
                          0000
                        </Typography>
                      </Box>
                    </Box>
                  </Box>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} lg={6}>
          <Card
            sx={{
              boxShadow: 'none',
              border: '1px solid #e0e0e0',
              transition: 'none !important',
              '&:hover': {
                boxShadow: 'none !important',
                transform: 'none !important',
              },
            }}
          >
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h6" fontWeight="600" sx={{ mb: 3 }}>
                Opções de Configuração
              </Typography>

              <Grid
                container
                spacing={2}
                sx={{
                  '& .MuiGrid-item': {
                    transition: 'none !important',
                    transform: 'none !important',
                  },
                }}
              >
                {menuItems.map((item) => {
                  const IconComponent = item.icon;
                  return (
                    <Grid item xs={12} sm={6} key={item.id}>
                      <Card
                        sx={{
                          cursor: 'pointer',
                          border:
                            selectedMenuItem === item.id
                              ? '2px solid'
                              : '1px solid',
                          borderColor:
                            selectedMenuItem === item.id
                              ? 'primary.main'
                              : 'divider',
                          backgroundColor:
                            selectedMenuItem === item.id
                              ? 'rgba(25, 118, 210, 0.04)'
                              : 'background.paper',
                          boxShadow: 'none',
                          transition: 'none !important',
                          '&:hover': {
                            borderColor: 'primary.main',
                            backgroundColor: 'rgba(25, 118, 210, 0.04)',
                            boxShadow: 'none !important',
                            transform: 'none !important',
                          },
                        }}
                        onClick={() => setSelectedMenuItem(item.id)}
                      >
                        <CardContent sx={{ p: 2 }}>
                          <Stack
                            direction="row"
                            alignItems="center"
                            spacing={2}
                          >
                            <IconComponent
                              color={
                                selectedMenuItem === item.id
                                  ? 'primary'
                                  : 'action'
                              }
                              fontSize="medium"
                            />
                            <Typography
                              variant="body1"
                              fontWeight={
                                selectedMenuItem === item.id ? 600 : 500
                              }
                              color={
                                selectedMenuItem === item.id
                                  ? 'primary.main'
                                  : 'text.primary'
                              }
                            >
                              {item.label}
                            </Typography>
                          </Stack>
                        </CardContent>
                      </Card>
                    </Grid>
                  );
                })}
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {selectedMenuItem && (
          <Grid item xs={12} lg={6}>
            <Card
              sx={{
                boxShadow: 'none',
                border: '1px solid #e0e0e0',
                transition: 'none !important',
                '&:hover': {
                  boxShadow: 'none !important',
                  transform: 'none !important',
                },
              }}
            >
              <CardContent sx={{ p: 3 }}>
                <Typography variant="h6" fontWeight="600" sx={{ mb: 3 }}>
                  {menuItems.find((item) => item.id === selectedMenuItem)?.label}
                </Typography>
                {renderContent()}
              </CardContent>
            </Card>
          </Grid>
        )}
      </Grid>

      <HistoricoAlteracoesModal
        open={historicoModalOpen}
        onClose={() => setHistoricoModalOpen(false)}
        equipamentoId={onuDetails.id}
        equipamentoNome={onuDetails.serialNumber}
        historico={historicoAlteracoes}
      />
    </Container>
  );
}
