import React, { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Container,
  Grid,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableHead,
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
import { oltManagerApi } from '@shared/api/oltManagerApi';
import type { AutofindOntSnmpInfo, OltSnmpInfo } from '@shared/api/oltManagerTypes';
import { useOltDetails } from '../model';

type Props = {
  oltId?: string;
  onBack?: () => void;
  onEdit?: () => void;
};

export const OLTDetailsPage: React.FC<Props> = ({ oltId, onBack, onEdit }) => {
  const { olt, liveInfo, loading, error, liveError } = useOltDetails(oltId);
  const [snmpInfo, setSnmpInfo] = useState<OltSnmpInfo | null>(null);
  const [snmpInfoLoading, setSnmpInfoLoading] = useState(false);
  const [snmpInfoError, setSnmpInfoError] = useState<string | null>(null);
  const [snmpInfoLastUpdated, setSnmpInfoLastUpdated] = useState<string | null>(
    null
  );
  const [autofindOnts, setAutofindOnts] = useState<AutofindOntSnmpInfo[]>([]);
  const [autofindLoading, setAutofindLoading] = useState(false);
  const [autofindError, setAutofindError] = useState<string | null>(null);

  const handleFetchSnmpInfo = useCallback(async () => {
    if (!olt?.id) {
      return;
    }
    setSnmpInfoLoading(true);
    setSnmpInfoError(null);
    try {
      const data = await oltManagerApi.getOltSnmpInfo(olt.id);
      setSnmpInfo(data);
      setSnmpInfoLastUpdated(new Date().toISOString());
    } catch (caught: unknown) {
      const message =
        caught instanceof Error ? caught.message : 'Falha ao buscar SNMP info';
      setSnmpInfoError(message);
      setSnmpInfo(null);
    } finally {
      setSnmpInfoLoading(false);
    }
  }, [olt?.id]);

  useEffect(() => {
    setSnmpInfo(null);
    setSnmpInfoError(null);
    setSnmpInfoLastUpdated(null);
    setAutofindOnts([]);
    setAutofindError(null);
  }, [olt?.id]);

  useEffect(() => {
    if (!olt?.id) {
      return;
    }
    void handleFetchSnmpInfo();
  }, [handleFetchSnmpInfo, olt?.id]);

  const handleFetchAutofind = useCallback(async () => {
    if (!olt?.id) {
      return;
    }
    setAutofindLoading(true);
    setAutofindError(null);
    try {
      const data = await oltManagerApi.getAutofindOntsSnmp(olt.id, { limit: 20 });
      setAutofindOnts(data);
    } catch (caught: unknown) {
      const message =
        caught instanceof Error
          ? caught.message
          : 'Falha ao buscar ONTs em autofind';
      setAutofindError(message);
      setAutofindOnts([]);
    } finally {
      setAutofindLoading(false);
    }
  }, [olt?.id]);

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
    if (liveInfo?.reachable) {
      return <Chip label="Conectada" color="success" size="small" />;
    }
    if (snmpInfo) {
      return <Chip label="Conectada (SNMP)" color="success" size="small" />;
    }
    if (!liveInfo) {
      return <Chip label="Indisponível" size="small" />;
    }
    return <Chip label="Sem resposta" color="error" size="small" />;
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
                    src="https://www.eternityx.com/wp-content/uploads/2022/04/Huawei-%E5%8D%8E%E4%B8%BA-Logo.png"
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
                    {
                      label: 'Sysname',
                      value: liveInfo?.sysname || snmpInfo?.sys_name || 'N/A',
                    },
                    { label: 'Versão da OLT', value: liveInfo?.version || 'N/A' },
                    {
                      label: 'SNMP SysDescr',
                      value: snmpInfo?.sys_descr || 'N/A',
                    },
                    {
                      label: 'SNMP SysObjectId',
                      value: snmpInfo?.sys_object_id || 'N/A',
                    },
                    {
                      label: 'SNMP SysUpTime',
                      value: snmpInfo?.sys_uptime || 'N/A',
                    },
                    {
                      label: 'SNMP atualizado em',
                      value: formatDate(snmpInfoLastUpdated),
                    },
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

          <AnimatedCard delay={400} sx={{ mt: 3 }}>
            <Box p={3}>
              <FlexBox
                justifyContent="space-between"
                alignItems="center"
                mb={2}
                flexWrap="wrap"
                gap={2}
              >
                <H5>Diagnósticos SNMP</H5>
                <FlexBox gap={2} flexWrap="wrap">
                  <Button
                    variant="outlined"
                    onClick={handleFetchSnmpInfo}
                    disabled={snmpInfoLoading || !olt?.id}
                  >
                    {snmpInfoLoading ? (
                      <CircularProgress size={18} />
                    ) : (
                      'Testar SNMP Info'
                    )}
                  </Button>
                  <Button
                    variant="outlined"
                    onClick={handleFetchAutofind}
                    disabled={autofindLoading || !olt?.id}
                  >
                    {autofindLoading ? (
                      <CircularProgress size={18} />
                    ) : (
                      'Buscar ONTs Autofind'
                    )}
                  </Button>
                </FlexBox>
              </FlexBox>

              {snmpInfoError && (
                <Alert severity="warning" sx={{ mb: 2 }}>
                  {snmpInfoError}
                </Alert>
              )}

              {snmpInfo && (
                <Table size="small" sx={{ mb: 3 }}>
                  <TableBody>
                    {[
                      { label: 'SysDescr', value: snmpInfo.sys_descr || 'N/A' },
                      { label: 'SysObjectId', value: snmpInfo.sys_object_id || 'N/A' },
                      { label: 'SysUpTime', value: snmpInfo.sys_uptime || 'N/A' },
                      { label: 'SysName', value: snmpInfo.sys_name || 'N/A' },
                    ].map((entry) => (
                      <TableRow key={entry.label}>
                        <TableCell
                          component="th"
                          scope="row"
                          sx={{ fontWeight: 500, width: '40%' }}
                        >
                          {entry.label}
                        </TableCell>
                        <TableCell>{entry.value}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}

              {autofindError && (
                <Alert severity="warning" sx={{ mb: 2 }}>
                  {autofindError}
                </Alert>
              )}

              {autofindOnts.length === 0 && !autofindLoading && (
                <Typography variant="body2" color="text.secondary">
                  Nenhuma ONT em autofind encontrada.
                </Typography>
              )}

              {autofindOnts.length > 0 && (
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Serial</TableCell>
                      <TableCell>Tipo</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Porta</TableCell>
                      <TableCell>ONT ID</TableCell>
                      <TableCell>ifIndex</TableCell>
                      <TableCell>Data</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {autofindOnts.map((ont, index) => (
                      <TableRow key={`${ont.serial_number}-${index}`}>
                        <TableCell>{ont.serial_number || 'N/A'}</TableCell>
                        <TableCell>{ont.ont_type || 'N/A'}</TableCell>
                        <TableCell>{ont.state || 'N/A'}</TableCell>
                        <TableCell>{ont.port || 'N/A'}</TableCell>
                        <TableCell>{ont.ont_id ?? 'N/A'}</TableCell>
                        <TableCell>{ont.if_index ?? 'N/A'}</TableCell>
                        <TableCell>{ont.autofind_time || 'N/A'}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </Box>
          </AnimatedCard>
        </>
      )}
    </Container>
  );
};
