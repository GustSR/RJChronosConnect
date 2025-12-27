import React, { useCallback, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Chip,
  Container,
  Grid,
  IconButton,
  Skeleton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  Tooltip,
  CircularProgress,
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  DeviceHub as DeviceHubIcon,
  Visibility as ViewIcon,
  NetworkCheck as NetworkCheckIcon,
} from '@mui/icons-material';
import { H6 } from '@shared/ui/components/Typography';
import { AnimatedCard, ConfirmDialog } from '@shared/ui/components';
import type { ManagedOLT } from '@shared/api/oltManagementTypes';
import { oltManagementApi } from '@shared/api/oltManagementApi';
import { oltManagerApi } from '@shared/api/oltManagerApi';
import { useOlts } from '../model';

type Props = {
  onAdd?: () => void;
  onViewDetails?: (oltId: string) => void;
};

export const OLTManagementPage: React.FC<Props> = ({ onAdd, onViewDetails }) => {
  const { olts, loading, error, reload } = useOlts();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [oltIdToDelete, setOltIdToDelete] = useState<string>('');
  const [connectionStatus, setConnectionStatus] = useState<
    Record<
      string,
      {
        loading?: boolean;
        reachable?: boolean;
        error?: string | null;
        sysname?: string | null;
        version?: string | null;
      }
    >
  >({});

  const handleRequestDeleteOLT = useCallback((oltId: string) => {
    setOltIdToDelete(oltId);
    setDeleteDialogOpen(true);
  }, []);

  const handleCloseDeleteDialog = useCallback(() => {
    setDeleteDialogOpen(false);
    setOltIdToDelete('');
  }, []);

  const handleConfirmDeleteOLT = useCallback(async () => {
    try {
      await oltManagementApi.deleteOlt(oltIdToDelete);
      await reload();
    } catch (err) {
      console.error('Erro ao excluir OLT:', err);
    } finally {
      handleCloseDeleteDialog();
    }
  }, [handleCloseDeleteDialog, oltIdToDelete, reload]);

  const handleTestConnection = useCallback(async (olt: ManagedOLT) => {
    const key = String(olt.id);
    setConnectionStatus((prev) => ({
      ...prev,
      [key]: {
        ...prev[key],
        loading: true,
        error: null,
      },
    }));

    try {
      const liveInfo = await oltManagementApi.getOltLiveInfo(olt.id).catch(
        () => null
      );
      if (liveInfo?.reachable) {
        setConnectionStatus((prev) => ({
          ...prev,
          [key]: {
            loading: false,
            reachable: true,
            sysname: liveInfo.sysname ?? null,
            version: liveInfo.version ?? null,
            error: null,
          },
        }));
        return;
      }

      const snmpInfo = await oltManagerApi.getOltSnmpInfo(olt.id);
      setConnectionStatus((prev) => ({
        ...prev,
        [key]: {
          loading: false,
          reachable: true,
          sysname: snmpInfo.sys_name ?? null,
          version: snmpInfo.sys_descr ?? null,
          error: null,
        },
      }));
    } catch (caught: unknown) {
      const message =
        caught instanceof Error ? caught.message : 'Falha ao testar conexão';
      setConnectionStatus((prev) => ({
        ...prev,
        [key]: {
          loading: false,
          reachable: false,
          sysname: null,
          version: null,
          error: message,
        },
      }));
    }
  }, []);

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

  const formatDate = (value?: string | null) =>
    value ? new Date(value).toLocaleString('pt-BR') : 'N/A';

  const renderConnectionChip = (oltId: string) => {
    const status = connectionStatus[oltId];
    if (!status) {
      return <Chip label="Não testado" size="small" />;
    }

    if (status.loading) {
      return <Chip label="Testando..." size="small" color="warning" />;
    }

    const label = status.reachable ? 'Conectada' : 'Sem resposta';
    const color = status.reachable ? 'success' : 'error';
    const details = status.reachable
      ? `Sysname: ${status.sysname || 'N/A'} | Versão: ${status.version || 'N/A'}`
      : status.error || 'Falha ao conectar';

    return (
      <Tooltip title={details}>
        <Box component="span">
          <Chip label={label} size="small" color={color} />
        </Box>
      </Tooltip>
    );
  };

  const configuredCount = olts.filter(
    (olt) => olt.setup_status === 'configured' || olt.is_configured
  ).length;
  const inProgressCount = olts.filter((olt) => olt.setup_status === 'in_progress').length;
  const failedCount = olts.filter((olt) => olt.setup_status === 'failed').length;

  const handleAddClick = useCallback(() => onAdd?.(), [onAdd]);
  const handleViewClick = useCallback(
    (olt: ManagedOLT) => onViewDetails?.(String(olt.id)),
    [onViewDetails]
  );

  return (
    <Container maxWidth="xl" sx={{ py: 4, px: 2 }}>
      <Box sx={{ mb: 4 }}>
        <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleAddClick}
            disabled={!onAdd}
          >
            Adicionar OLT
          </Button>
        </Box>
      </Box>

      <Grid container spacing={3} mb={3}>
        <Grid item xs={12} sm={6} md={3}>
          <AnimatedCard delay={100} sx={{ p: 2, textAlign: 'center' }} disableHoverEffect>
            <DeviceHubIcon color="primary" sx={{ fontSize: 40, mb: 1 }} />
            <H6>OLTs conectadas</H6>
            <Typography variant="h4" color="primary">
              {olts.length}
            </Typography>
          </AnimatedCard>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <AnimatedCard delay={200} sx={{ p: 2, textAlign: 'center' }} disableHoverEffect>
            <DeviceHubIcon color="success" sx={{ fontSize: 40, mb: 1 }} />
            <H6>Configuradas</H6>
            <Typography variant="h4" color="success.main">
              {configuredCount}
            </Typography>
          </AnimatedCard>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <AnimatedCard delay={300} sx={{ p: 2, textAlign: 'center' }} disableHoverEffect>
            <DeviceHubIcon color="warning" sx={{ fontSize: 40, mb: 1 }} />
            <H6>Em progresso</H6>
            <Typography variant="h4" color="warning.main">
              {inProgressCount}
            </Typography>
          </AnimatedCard>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <AnimatedCard delay={400} sx={{ p: 2, textAlign: 'center' }} disableHoverEffect>
            <DeviceHubIcon color="error" sx={{ fontSize: 40, mb: 1 }} />
            <H6>Com falha</H6>
            <Typography variant="h4" color="error.main">
              {failedCount}
            </Typography>
          </AnimatedCard>
        </Grid>
      </Grid>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
          <Button color="inherit" size="small" onClick={reload} sx={{ ml: 2 }}>
            Tentar novamente
          </Button>
        </Alert>
      )}

      <AnimatedCard delay={500} sx={{ borderRadius: 3, mt: 2 }} disableHoverEffect>
        <Box sx={{ p: 0 }}>
          {loading ? (
            <Box p={2}>
              {[...Array(5)].map((_, index) => (
                <Box key={index} mb={2}>
                  <Skeleton variant="rectangular" height={60} sx={{ borderRadius: 1 }} />
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
                    <TableCell>Fabricante</TableCell>
                    <TableCell>Modelo</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Conexão</TableCell>
                    <TableCell>Descoberta em</TableCell>
                    <TableCell align="center">Ações</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {olts.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={9} align="center">
                        <Box py={4}>
                          <DeviceHubIcon sx={{ fontSize: 60, color: 'grey.400', mb: 2 }} />
                          <Typography color="text.secondary">Nenhuma OLT encontrada</Typography>
                          <Button
                            variant="outlined"
                            startIcon={<AddIcon />}
                            onClick={handleAddClick}
                            sx={{ mt: 2 }}
                            disabled={!onAdd}
                          >
                            Adicionar primeira OLT
                          </Button>
                        </Box>
                      </TableCell>
                    </TableRow>
                  ) : (
                    olts.map((olt) => (
                      <TableRow key={olt.id} hover>
                        <TableCell>{olt.id}</TableCell>
                        <TableCell>
                          <Typography fontWeight={500}>{olt.name}</Typography>
                        </TableCell>
                        <TableCell>{olt.ip_address}</TableCell>
                        <TableCell>{olt.vendor || 'N/A'}</TableCell>
                        <TableCell>{olt.model || 'N/A'}</TableCell>
                        <TableCell>{getSetupStatusChip(olt.setup_status, olt.is_configured)}</TableCell>
                        <TableCell>{renderConnectionChip(String(olt.id))}</TableCell>
                        <TableCell>{formatDate(olt.discovered_at)}</TableCell>
                        <TableCell align="center">
                          <IconButton
                            color="primary"
                            onClick={() => handleViewClick(olt)}
                            title="Ver detalhes"
                            disabled={!onViewDetails}
                          >
                            <ViewIcon />
                          </IconButton>
                          <Tooltip title="Testar conexão">
                            <span>
                              <IconButton
                                color={
                                  connectionStatus[String(olt.id)]?.reachable
                                    ? 'success'
                                    : 'default'
                                }
                                onClick={() => handleTestConnection(olt)}
                                disabled={connectionStatus[String(olt.id)]?.loading}
                              >
                                {connectionStatus[String(olt.id)]?.loading ? (
                                  <CircularProgress size={18} />
                                ) : (
                                  <NetworkCheckIcon />
                                )}
                              </IconButton>
                            </span>
                          </Tooltip>
                          <IconButton
                            color="error"
                            onClick={() => handleRequestDeleteOLT(String(olt.id))}
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

      <ConfirmDialog
        open={deleteDialogOpen}
        title="Confirmar Exclusão"
        description="Tem certeza que deseja excluir esta OLT? Esta ação não pode ser desfeita."
        cancelText="Cancelar"
        confirmText="Excluir"
        confirmColor="error"
        onClose={handleCloseDeleteDialog}
        onConfirm={handleConfirmDeleteOLT}
      />
    </Container>
  );
};
