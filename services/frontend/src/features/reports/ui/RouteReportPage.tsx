import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Chip,
  Container,
  Grid,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography,
  CircularProgress,
} from '@mui/material';
import { AnimatedCard } from '@shared/ui/components';
import { H3, H5 } from '@shared/ui/components/Typography';
import FlexBox from '@shared/ui/components/FlexBox';
import { useOlts } from '@features/olt/model';
import { oltManagerApi } from '@shared/api/oltManagerApi';
import type { GponPort, OntSnmpInfo, RouteReport } from '@shared/api/oltManagerTypes';

const classificationMap: Record<
  string,
  { label: string; color: 'default' | 'error' | 'warning' | 'success' }
> = {
  'route-down': { label: 'Queda de Rota', color: 'error' },
  partial: { label: 'Parcial', color: 'warning' },
  normal: { label: 'Normal', color: 'success' },
};

type OntStatusKey = 'online' | 'los' | 'offline' | 'dyinggasp' | 'unknown';

const statusMap: Record<
  OntStatusKey,
  { label: string; color: 'default' | 'error' | 'warning' | 'success' }
> = {
  online: { label: 'online', color: 'success' },
  los: { label: 'LOS', color: 'error' },
  offline: { label: 'offline', color: 'default' },
  dyinggasp: { label: 'dyinggasp', color: 'warning' },
  unknown: { label: 'desconhecido', color: 'default' },
};

const resolveOntStatus = (
  ont: OntSnmpInfo,
  losOnts: Set<number>
): OntStatusKey => {
  const onlineState = (ont.online_state || '').trim().toLowerCase();
  const lastDown = (ont.last_down_cause || '').trim().toLowerCase();
  const hasLos = losOnts.has(ont.ont_id);

  if (onlineState === 'online') {
    return 'online';
  }
  if (onlineState === 'offline') {
    if (lastDown === 'dying-gasp' || lastDown === 'dyinggasp') {
      return 'dyinggasp';
    }
    if (lastDown === 'loss-of-signal' || lastDown === 'los' || hasLos) {
      return 'los';
    }
    return 'offline';
  }
  if (hasLos) {
    return 'los';
  }
  if (lastDown === 'dying-gasp' || lastDown === 'dyinggasp') {
    return 'dyinggasp';
  }
  return 'unknown';
};

export const RouteReportPage: React.FC = () => {
  const { olts, loading: oltsLoading, error: oltsError } = useOlts();
  const [oltId, setOltId] = useState<string>('');
  const [slot, setSlot] = useState<string>('');
  const [pon, setPon] = useState<string>('');
  const [threshold, setThreshold] = useState<number>(10);
  const [report, setReport] = useState<RouteReport | null>(null);
  const [onts, setOnts] = useState<OntSnmpInfo[]>([]);
  const [ports, setPorts] = useState<GponPort[]>([]);
  const [portsLoading, setPortsLoading] = useState(false);
  const [portsError, setPortsError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [downloadLoading, setDownloadLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!oltId) {
      setPorts([]);
      setSlot('');
      setPon('');
      setPortsError(null);
      return;
    }

    setPortsLoading(true);
    setPortsError(null);
    setPorts([]);
    setSlot('');
    setPon('');
    setReport(null);
    setOnts([]);

    const loadPorts = async () => {
      try {
        const data = await oltManagerApi.getGponPorts(oltId);
        setPorts(data);
      } catch (caught: unknown) {
        const message =
          caught instanceof Error
            ? caught.message
            : 'Falha ao carregar portas GPON';
        setPortsError(message);
      } finally {
        setPortsLoading(false);
      }
    };

    void loadPorts();
  }, [oltId]);

  useEffect(() => {
    setReport(null);
    setOnts([]);
  }, [slot, pon]);

  const slotOptions = useMemo(() => {
    const slots = new Set<number>();
    ports.forEach((port) => {
      if (port.slot !== null && port.slot !== undefined) {
        slots.add(port.slot);
      }
    });
    return Array.from(slots).sort((a, b) => a - b);
  }, [ports]);

  const ponOptions = useMemo(() => {
    if (!slot) {
      return [];
    }
    const slotValue = Number(slot);
    const pons = new Set<number>();
    ports.forEach((port) => {
      if (port.slot === slotValue && port.pon !== null && port.pon !== undefined) {
        pons.add(port.pon);
      }
    });
    return Array.from(pons).sort((a, b) => a - b);
  }, [ports, slot]);

  const selectedPort = useMemo(() => {
    if (!slot || !pon) {
      return null;
    }
    const slotValue = Number(slot);
    const ponValue = Number(pon);
    return (
      ports.find(
        (port) => port.slot === slotValue && port.pon === ponValue
      ) || null
    );
  }, [ports, slot, pon]);

  const isFormValid = useMemo(
    () => Boolean(oltId && slot && pon && selectedPort),
    [oltId, slot, pon, selectedPort]
  );

  const buildPayload = useCallback(
    (format: 'json' | 'xlsx' | 'xml') => {
      const slotValue = slot ? Number(slot) : undefined;
      const ponValue = pon ? Number(pon) : undefined;
      return {
        frame: selectedPort?.frame ?? 0,
        slot: slotValue,
        pon: ponValue,
        port: selectedPort?.port ?? undefined,
        if_index: selectedPort?.if_index ?? undefined,
        los_threshold: threshold,
        format,
      };
    },
    [slot, pon, selectedPort, threshold]
  );

  const handleGenerate = useCallback(async () => {
    if (!isFormValid || !selectedPort) {
      setError('Selecione a OLT e uma porta GPON.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const frameValue = selectedPort.frame ?? 0;
      const slotValue = selectedPort.slot ?? Number(slot);
      const ponValue = selectedPort.pon ?? Number(pon);

      const [reportData, ontData] = await Promise.all([
        oltManagerApi.getRouteReport(oltId, buildPayload('json')),
        oltManagerApi.getOntsOnPort(oltId, frameValue, slotValue, ponValue),
      ]);
      setReport(reportData);
      setOnts(ontData);
    } catch (caught: unknown) {
      const message =
        caught instanceof Error
          ? caught.message
          : 'Falha ao gerar relatorio';
      setError(message);
      setReport(null);
      setOnts([]);
    } finally {
      setLoading(false);
    }
  }, [buildPayload, isFormValid, oltId, pon, selectedPort, slot]);

  const handleDownload = useCallback(
    async (format: 'xlsx' | 'xml') => {
      if (!isFormValid) {
        setError('Selecione a OLT e uma porta GPON.');
        return;
      }
      setDownloadLoading(format);
      setError(null);
      try {
        const { blob, filename } = await oltManagerApi.downloadRouteReport(
          oltId,
          buildPayload(format)
        );
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        link.click();
        URL.revokeObjectURL(url);
      } catch (caught: unknown) {
        const message =
          caught instanceof Error
            ? caught.message
            : 'Falha ao baixar relatorio';
        setError(message);
      } finally {
        setDownloadLoading(null);
      }
    },
    [buildPayload, isFormValid, oltId]
  );

  const summary = report?.summary;
  const classification = summary
    ? classificationMap[summary.classification] || {
        label: summary.classification,
        color: 'default',
      }
    : null;

  const losOnts = useMemo(() => {
    const set = new Set<number>();
    report?.onus.forEach((onu) => {
      set.add(onu.ont_index);
    });
    return set;
  }, [report]);

  const previewOnts = useMemo(() => {
    return [...onts]
      .sort((a, b) => a.ont_id - b.ont_id)
      .map((ont) => ({
        ont,
        status: resolveOntStatus(ont, losOnts),
      }));
  }, [losOnts, onts]);

  return (
    <Container maxWidth="xl" sx={{ py: 4, px: 2 }}>
      <AnimatedCard delay={0}>
        <Box p={3}>
          <FlexBox alignItems="center" justifyContent="space-between" mb={2}>
            <H3>Relatorio de Rota (LOS)</H3>
            {loading && <CircularProgress size={20} />}
          </FlexBox>
          <Typography color="text.secondary" mb={3}>
            Gere o relatorio de ONUs em LOS por porta GPON e exporte em XLSX ou
            XML.
          </Typography>

          {oltsError && (
            <Alert severity="warning" sx={{ mb: 2 }}>
              {oltsError}
            </Alert>
          )}

          {!oltsLoading && !oltsError && olts.length === 0 && (
            <Alert severity="info" sx={{ mb: 2 }}>
              Nenhuma OLT cadastrada.
            </Alert>
          )}

          {portsError && (
            <Alert severity="warning" sx={{ mb: 2 }}>
              {portsError}
            </Alert>
          )}

          {!portsLoading && oltId && !portsError && ports.length === 0 && (
            <Alert severity="info" sx={{ mb: 2 }}>
              Nenhuma porta GPON encontrada para esta OLT.
            </Alert>
          )}

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <Grid container spacing={2}>
            <Grid item xs={12} md={4}>
              <TextField
                select
                fullWidth
                label="OLT"
                value={oltId}
                onChange={(event) => setOltId(event.target.value)}
                disabled={oltsLoading}
              >
                {olts.map((olt) => (
                  <MenuItem key={olt.id} value={String(olt.id)}>
                    {olt.name} ({olt.ip_address})
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={6} md={2}>
              <TextField
                select
                fullWidth
                label="Slot"
                value={slot}
                onChange={(event) => {
                  setSlot(event.target.value);
                  setPon('');
                }}
                disabled={!oltId || portsLoading || slotOptions.length === 0}
              >
                {slotOptions.map((slotValue) => (
                  <MenuItem key={slotValue} value={String(slotValue)}>
                    {slotValue}
                  </MenuItem>
                ))}
                {slotOptions.length === 0 && (
                  <MenuItem value="" disabled>
                    {portsLoading ? 'Carregando portas...' : 'Nenhum slot encontrado'}
                  </MenuItem>
                )}
              </TextField>
            </Grid>
            <Grid item xs={6} md={2}>
              <TextField
                select
                fullWidth
                label="PON"
                value={pon}
                onChange={(event) => setPon(event.target.value)}
                disabled={!slot || portsLoading || ponOptions.length === 0}
              >
                {ponOptions.map((ponValue) => (
                  <MenuItem key={ponValue} value={String(ponValue)}>
                    {ponValue}
                  </MenuItem>
                ))}
                {ponOptions.length === 0 && (
                  <MenuItem value="" disabled>
                    {portsLoading ? 'Carregando portas...' : 'Nenhum PON encontrado'}
                  </MenuItem>
                )}
              </TextField>
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Threshold LOS"
                type="number"
                value={threshold}
                onChange={(event) => setThreshold(Number(event.target.value))}
                inputProps={{ min: 1, max: 128 }}
              />
            </Grid>
          </Grid>

          <FlexBox mt={3} gap={2} flexWrap="wrap">
            <Button
              variant="contained"
              onClick={handleGenerate}
              disabled={!isFormValid || loading}
            >
              Gerar Preview
            </Button>
            <Button
              variant="outlined"
              onClick={() => handleDownload('xlsx')}
              disabled={!isFormValid || downloadLoading === 'xlsx'}
            >
              {downloadLoading === 'xlsx' ? 'Baixando...' : 'Baixar XLSX'}
            </Button>
            <Button
              variant="outlined"
              onClick={() => handleDownload('xml')}
              disabled={!isFormValid || downloadLoading === 'xml'}
            >
              {downloadLoading === 'xml' ? 'Baixando...' : 'Baixar XML'}
            </Button>
          </FlexBox>
        </Box>
      </AnimatedCard>

      {summary && (
        <AnimatedCard delay={100} sx={{ mt: 3 }}>
          <Box p={3}>
            <FlexBox alignItems="center" justifyContent="space-between" mb={2}>
              <H5>Resumo</H5>
              {classification && (
                <Chip
                  label={classification.label}
                  color={classification.color}
                  size="small"
                />
              )}
            </FlexBox>
            <Grid container spacing={2}>
              <Grid item xs={12} md={3}>
                <Typography variant="subtitle2" color="text.secondary">
                  Porta
                </Typography>
                <Typography variant="body1">
                  {(summary.slot ?? 'N/A')}/{(summary.pon ?? 'N/A')} (ifIndex{' '}
                  {summary.if_index})
                </Typography>
              </Grid>
              <Grid item xs={12} md={3}>
                <Typography variant="subtitle2" color="text.secondary">
                  ONUs em LOS
                </Typography>
                <Typography variant="body1">{summary.los_count}</Typography>
              </Grid>
              <Grid item xs={12} md={3}>
                <Typography variant="subtitle2" color="text.secondary">
                  Coletado em
                </Typography>
                <Typography variant="body1">
                  {new Date(summary.generated_at).toLocaleString('pt-BR')}
                </Typography>
              </Grid>
            </Grid>
          </Box>
        </AnimatedCard>
      )}

      {(report || previewOnts.length > 0) && (
        <AnimatedCard delay={200} sx={{ mt: 3 }}>
          <Box p={3}>
            <H5 mb={2}>ONTs na porta</H5>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>ONT</TableCell>
                  <TableCell>SN</TableCell>
                  <TableCell>Descricao</TableCell>
                  <TableCell>Sinal</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {previewOnts.map(({ ont, status }) => {
                  const meta = statusMap[status] || statusMap.unknown;
                  return (
                    <TableRow key={`${ont.if_index || ont.port}-${ont.ont_id}`}>
                      <TableCell>{ont.ont_id}</TableCell>
                      <TableCell>{ont.serial_number || 'N/A'}</TableCell>
                      <TableCell>{ont.description || 'N/A'}</TableCell>
                      <TableCell>
                        <Chip
                          label={meta.label}
                          color={meta.color}
                          size="small"
                        />
                      </TableCell>
                    </TableRow>
                  );
                })}
                {previewOnts.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4} align="center">
                      Nenhuma ONU encontrada para esta porta.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </Box>
        </AnimatedCard>
      )}
    </Container>
  );
};
