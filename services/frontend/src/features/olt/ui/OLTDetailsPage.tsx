import React from 'react';
import {
  Alert,
  Box,
  Button,
  Chip,
  Container,
  Grid,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableRow,
  Typography,
  Skeleton,
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  DeviceHub as DeviceHubIcon,
  Edit as EditIcon,
} from '@mui/icons-material';
import { AnimatedCard } from '@shared/ui/components';
import { H3, H5 } from '@shared/ui/components/Typography';
import FlexBox from '@shared/ui/components/FlexBox';
import { useOltDetails } from '../model';

type Props = {
  oltId?: string;
  onBack?: () => void;
  onEdit?: () => void;
};

export const OLTDetailsPage: React.FC<Props> = ({ oltId, onBack, onEdit }) => {
  const { olt, liveInfo, loading, error, liveError } = useOltDetails(oltId);

  const formatDate = (value?: string | null) =>
    value ? new Date(value).toLocaleString('pt-BR') : 'N/A';

  const getSetupStatusChip = (status: string, isConfigured: boolean) => {
    const normalized = status || (isConfigured ? 'configured' : 'pending');
    const labels: Record<string, string> = {
      configured: 'Configurada',
      in_progress: 'Em progresso',
      pending: 'Pendente',
      failed: 'Falhou',
    };
    const colors: Record<string, 'default' | 'success' | 'warning' | 'error'> = {
      configured: 'success',
      in_progress: 'warning',
      pending: 'default',
      failed: 'error',
    };

    return (
      <Chip
        label={labels[normalized] || normalized}
        color={colors[normalized] || 'default'}
        size="small"
      />
    );
  };

  const getReachabilityChip = () => {
    if (!liveInfo) {
      return <Chip label="Indisponível" size="small" />;
    }
    return (
      <Chip
        label={liveInfo.reachable ? 'Conectada' : 'Sem resposta'}
        color={liveInfo.reachable ? 'success' : 'error'}
        size="small"
      />
    );
  };

  return (
    <Container maxWidth="xl" sx={{ py: 4, px: 2 }}>
      {loading && (
        <AnimatedCard delay={0}>
          <Box p={3}>
            <FlexBox alignItems="center" mb={3}>
              <IconButton onClick={onBack} sx={{ mr: 2 }} disabled={!onBack}>
                <ArrowBackIcon />
              </IconButton>
              <Skeleton variant="text" width={300} height={40} />
            </FlexBox>
            <Skeleton variant="rectangular" height={200} sx={{ borderRadius: 1 }} />
          </Box>
        </AnimatedCard>
      )}

      {error && !olt && !loading && (
        <AnimatedCard delay={100}>
          <Box p={3}>
            <FlexBox alignItems="center" mb={3}>
              <IconButton onClick={onBack} sx={{ mr: 2 }} disabled={!onBack}>
                <ArrowBackIcon />
              </IconButton>
              <H3>Detalhes da OLT</H3>
            </FlexBox>
            <Alert severity="error">{error || 'OLT não encontrada'}</Alert>
          </Box>
        </AnimatedCard>
      )}

      {!loading && olt && (
        <>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 4 }}>
            <IconButton
              onClick={onBack}
              sx={{ mr: 2, color: 'primary.main' }}
              disabled={!onBack}
            >
              <ArrowBackIcon />
            </IconButton>
            <Box sx={{ flexGrow: 1 }}>
              <Typography variant="h4" fontWeight="700" sx={{ mb: 1 }}>
                {olt.name}
              </Typography>
              <Typography variant="body1" color="text.secondary">
                {olt.ip_address}
              </Typography>
            </Box>
            <Button
              variant="outlined"
              startIcon={<EditIcon />}
              onClick={onEdit}
              disabled={!onEdit}
            >
              Editar OLT
            </Button>
          </Box>

          <AnimatedCard delay={100} sx={{ mb: 3 }}>
            <Box p={3}>
              <Grid container spacing={3} alignItems="center">
                <Grid item>
                  <Box
                    component="img"
                    src="/static/brand-logo/huawei-logo.png"
                    alt="Huawei"
                    sx={{ width: 100, height: 60, objectFit: 'contain' }}
                    onError={() => {
                      // ignore
                    }}
                  />
                  <DeviceHubIcon sx={{ fontSize: 60, display: 'none', color: 'grey.400' }} />
                </Grid>
                <Grid item flexGrow={1}>
                  <FlexBox alignItems="center" gap={1}>
                    <Typography variant="body2" color="text.secondary">
                      Configuração:
                    </Typography>
                    {getSetupStatusChip(olt.setup_status, olt.is_configured)}
                  </FlexBox>
                  <FlexBox alignItems="center" gap={1} mt={1}>
                    <Typography variant="body2" color="text.secondary">
                      Conexão:
                    </Typography>
                    {getReachabilityChip()}
                  </FlexBox>
                </Grid>
              </Grid>
            </Box>
          </AnimatedCard>

          <AnimatedCard delay={200} sx={{ mb: 3 }}>
            <Box p={3}>
              <FlexBox justifyContent="space-between" alignItems="center" mb={2}>
                <H5>Informações cadastradas</H5>
              </FlexBox>
              <Table size="small">
                <TableBody>
                  {[
                    { label: 'Nome', value: olt.name },
                    { label: 'IP da OLT', value: olt.ip_address },
                    { label: 'Fabricante', value: olt.vendor || 'N/A' },
                    { label: 'Modelo', value: olt.model || 'N/A' },
                    { label: 'Porta SSH', value: olt.ssh_port ?? 'N/A' },
                    {
                      label: 'Status de configuração',
                      value: getSetupStatusChip(olt.setup_status, olt.is_configured),
                    },
                    { label: 'Configurada', value: olt.is_configured ? 'Sim' : 'Não' },
                    { label: 'Descoberta em', value: formatDate(olt.discovered_at) },
                    { label: 'Última sincronização', value: formatDate(olt.last_sync_at) },
                    { label: 'Criada em', value: formatDate(olt.created_at) },
                    { label: 'Atualizada em', value: formatDate(olt.updated_at) },
                  ].map((setting) => (
                    <TableRow key={setting.label}>
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
            </Box>
          </AnimatedCard>

          <AnimatedCard delay={300}>
            <Box p={3}>
              <FlexBox justifyContent="space-between" alignItems="center" mb={2}>
                <H5>Informações ao vivo</H5>
              </FlexBox>
              {liveError && !liveInfo && (
                <Alert severity="warning" sx={{ mb: 2 }}>
                  {liveError}
                </Alert>
              )}
              <Table size="small">
                <TableBody>
                  {[
                    { label: 'Conexão', value: getReachabilityChip() },
                    { label: 'Sysname', value: liveInfo?.sysname || 'N/A' },
                    { label: 'Versão da OLT', value: liveInfo?.version || 'N/A' },
                  ].map((setting) => (
                    <TableRow key={setting.label}>
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
            </Box>
          </AnimatedCard>
        </>
      )}
    </Container>
  );
};
