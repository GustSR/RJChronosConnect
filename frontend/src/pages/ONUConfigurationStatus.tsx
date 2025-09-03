import React from 'react';
import {
  Box,
  Container,
  Typography,
  Grid,
  CardContent,
  Button,
  Alert,
  Stepper,
  Step,
  StepLabel,
  Stack,
  Chip,
  IconButton,
} from '@mui/material';
import {
  ArrowBack,
  Download,
  Refresh,
  CheckCircle as CheckIcon,
  Error as ErrorIcon,
  Schedule,
} from '@mui/icons-material';
import { useNavigate, useParams } from 'react-router-dom';
import useTitle from '../hooks/useTitle';
import AnimatedCard from '../components/common/AnimatedCard';

interface ConfigurationStatus {
  step: string;
  status: 'pending' | 'completed' | 'error';
  message: string;
}

const ONUConfigurationStatus: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  useTitle('Status da Configuração - RJ Chronos');

  // Simular status da configuração
  const [configurationSteps] = React.useState<ConfigurationStatus[]>([
    {
      step: 'Validação dos dados',
      status: 'completed',
      message: 'Configurações validadas com sucesso',
    },
    {
      step: 'Aplicação na ONU',
      status: 'completed',
      message: 'Comandos enviados para a ONU',
    },
    {
      step: 'Configuração Wi-Fi',
      status: 'completed',
      message: 'Redes Wi-Fi configuradas',
    },
    {
      step: 'Configuração de VLAN',
      status: 'completed',
      message: 'VLANs aplicadas',
    },
    {
      step: 'Testes de conectividade',
      status: 'completed',
      message: 'Conectividade testada com sucesso',
    },
    {
      step: 'Finalização',
      status: 'completed',
      message: 'ONU provisionada e ativa',
    },
  ]);

  const [overallStatus] = React.useState<'success' | 'error' | 'pending'>(
    'success'
  );

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckIcon sx={{ color: '#10b981', fontSize: 20 }} />;
      case 'error':
        return <ErrorIcon sx={{ color: '#ef4444', fontSize: 20 }} />;
      case 'pending':
        return <Schedule sx={{ color: '#f59e0b', fontSize: 20 }} />;
      default:
        return null;
    }
  };

  const handleDownloadConfig = () => {
    // Simular download de configuração
    const configData = {
      onuId: id,
      serialNumber: 'GPON12345678',
      configuredAt: new Date().toISOString(),
      settings: {
        deviceName: 'ONU-5678',
        profile: 'residential_100mb',
        vlan: 100,
        wifi: {
          ssid2g: 'CHRONOS_5678_2G',
          ssid5g: 'CHRONOS_5678_5G',
          security: 'wpa2',
        },
      },
    };

    const blob = new Blob([JSON.stringify(configData, null, 2)], {
      type: 'application/json',
    });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `onu-config-${id}.json`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 4 }}>
        <IconButton
          onClick={() => navigate('/provisionar')}
          sx={{ mr: 2, color: 'primary.main' }}
        >
          <ArrowBack />
        </IconButton>
        <Box sx={{ flexGrow: 1 }}>
          <Typography variant="h4" fontWeight="700" sx={{ mb: 1 }}>
            Status da Configuração
          </Typography>
          <Typography variant="body1" color="text.secondary">
            ONU {id} - Processo de provisionamento
          </Typography>
        </Box>
      </Box>

      <Grid container spacing={3}>
        {/* Status Geral */}
        <Grid item xs={12}>
          <AnimatedCard delay={100}>
            <CardContent>
              {overallStatus === 'success' && (
                <Alert severity="success" icon={<CheckIcon />} sx={{ mb: 3 }}>
                  <Typography variant="h6" fontWeight="600">
                    Configuração Aplicada com Sucesso!
                  </Typography>
                  <Typography variant="body2" sx={{ mt: 1 }}>
                    A ONU foi provisionada e está ativa na rede. Todos os testes
                    de conectividade foram bem-sucedidos.
                  </Typography>
                </Alert>
              )}

              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  mb: 3,
                }}
              >
                <Typography variant="h6" fontWeight="600">
                  Progresso da Configuração
                </Typography>
                <Chip
                  label="Concluído"
                  color="success"
                  icon={<CheckIcon />}
                  sx={{ fontWeight: 600 }}
                />
              </Box>

              <Stepper orientation="vertical">
                {configurationSteps.map((step, index) => (
                  <Step
                    key={index}
                    active={true}
                    completed={step.status === 'completed'}
                  >
                    <StepLabel
                      icon={getStatusIcon(step.status)}
                      sx={{
                        '& .MuiStepLabel-labelContainer': {
                          '& .MuiStepLabel-label': {
                            fontWeight: 500,
                            fontSize: '0.95rem',
                          },
                        },
                      }}
                    >
                      <Box>
                        <Typography variant="body1" fontWeight="500">
                          {step.step}
                        </Typography>
                        <Typography
                          variant="body2"
                          color="text.secondary"
                          sx={{ mt: 0.5 }}
                        >
                          {step.message}
                        </Typography>
                      </Box>
                    </StepLabel>
                  </Step>
                ))}
              </Stepper>
            </CardContent>
          </AnimatedCard>
        </Grid>

        {/* Informações da ONU Configurada */}
        <Grid item xs={12} md={6}>
          <AnimatedCard delay={200}>
            <CardContent>
              <Typography variant="h6" fontWeight="600" sx={{ mb: 3 }}>
                Detalhes da Configuração
              </Typography>

              <Stack spacing={2}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2" color="text.secondary">
                    Número de Série:
                  </Typography>
                  <Typography variant="body2" fontWeight="600">
                    GPON12345678
                  </Typography>
                </Box>

                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2" color="text.secondary">
                    Perfil Aplicado:
                  </Typography>
                  <Typography variant="body2" fontWeight="600">
                    Residencial 100MB
                  </Typography>
                </Box>

                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2" color="text.secondary">
                    VLAN:
                  </Typography>
                  <Typography variant="body2" fontWeight="600">
                    100
                  </Typography>
                </Box>

                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2" color="text.secondary">
                    Wi-Fi 2.4GHz:
                  </Typography>
                  <Typography variant="body2" fontWeight="600">
                    CHRONOS_5678_2G
                  </Typography>
                </Box>

                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2" color="text.secondary">
                    Wi-Fi 5GHz:
                  </Typography>
                  <Typography variant="body2" fontWeight="600">
                    CHRONOS_5678_5G
                  </Typography>
                </Box>

                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2" color="text.secondary">
                    Status:
                  </Typography>
                  <Chip
                    label="Ativo"
                    color="success"
                    size="small"
                    sx={{ fontWeight: 600 }}
                  />
                </Box>
              </Stack>
            </CardContent>
          </AnimatedCard>
        </Grid>

        {/* Ações */}
        <Grid item xs={12} md={6}>
          <AnimatedCard delay={300}>
            <CardContent>
              <Typography variant="h6" fontWeight="600" sx={{ mb: 3 }}>
                Próximos Passos
              </Typography>

              <Stack spacing={2}>
                <Button
                  fullWidth
                  variant="contained"
                  startIcon={<Download />}
                  onClick={handleDownloadConfig}
                  sx={{
                    borderRadius: 3,
                    background: 'linear-gradient(135deg, #6366f1, #5855eb)',
                    '&:hover': {
                      background: 'linear-gradient(135deg, #5855eb, #4f46e5)',
                    },
                  }}
                >
                  Baixar Configuração
                </Button>

                <Button
                  fullWidth
                  variant="outlined"
                  startIcon={<Refresh />}
                  onClick={() => navigate(`/provisionar/${id}`)}
                  sx={{ borderRadius: 3 }}
                >
                  Reconfigurar ONU
                </Button>

                <Button
                  fullWidth
                  variant="outlined"
                  onClick={() => navigate('/provisionar')}
                  sx={{ borderRadius: 3 }}
                >
                  Voltar para Lista
                </Button>
              </Stack>

              <Alert severity="info" sx={{ mt: 3 }}>
                <Typography variant="body2">
                  A ONU está agora ativa e pode ser utilizada pelo cliente.
                  Lembre-se de informar as credenciais Wi-Fi ao usuário final.
                </Typography>
              </Alert>
            </CardContent>
          </AnimatedCard>
        </Grid>
      </Grid>
    </Container>
  );
};

export default ONUConfigurationStatus;
