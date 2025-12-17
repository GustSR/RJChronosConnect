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
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  DeviceHub as DeviceHubIcon,
  Visibility as ViewIcon,
} from '@mui/icons-material';
import { H6 } from '@shared/ui/components/Typography';
import { AnimatedCard, ConfirmDialog } from '@shared/ui/components';
import type { OLT } from '@shared/api/types';
import { useOlts } from '../model';

type Props = {
  onAdd?: () => void;
  onViewDetails?: (oltId: string) => void;
};

export const OLTManagementPage: React.FC<Props> = ({ onAdd, onViewDetails }) => {
  const { olts, loading, error, reload } = useOlts();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [oltIdToDelete, setOltIdToDelete] = useState<string>('');

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
      // TODO: Implementar API de delete
      // await genieacsApi.deleteOLT(oltIdToDelete);
      await reload();
    } catch (err) {
      console.error('Erro ao excluir OLT:', err);
    } finally {
      handleCloseDeleteDialog();
    }
  }, [handleCloseDeleteDialog, oltIdToDelete, reload]);

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

  const handleAddClick = useCallback(() => onAdd?.(), [onAdd]);
  const handleViewClick = useCallback(
    (olt: OLT) => onViewDetails?.(olt.id),
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
            <H6>Total de OLTs</H6>
            <Typography variant="h4" color="primary">
              {olts.length}
            </Typography>
          </AnimatedCard>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <AnimatedCard delay={200} sx={{ p: 2, textAlign: 'center' }} disableHoverEffect>
            <DeviceHubIcon color="success" sx={{ fontSize: 40, mb: 1 }} />
            <H6>OLTs Online</H6>
            <Typography variant="h4" color="success.main">
              {olts.filter((olt) => olt.status === 'online').length}
            </Typography>
          </AnimatedCard>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <AnimatedCard delay={300} sx={{ p: 2, textAlign: 'center' }} disableHoverEffect>
            <DeviceHubIcon color="error" sx={{ fontSize: 40, mb: 1 }} />
            <H6>OLTs Offline</H6>
            <Typography variant="h4" color="error.main">
              {olts.filter((olt) => olt.status !== 'online').length}
            </Typography>
          </AnimatedCard>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <AnimatedCard delay={400} sx={{ p: 2, textAlign: 'center' }} disableHoverEffect>
            <DeviceHubIcon color="info" sx={{ fontSize: 40, mb: 1 }} />
            <H6>Taxa de Disponibilidade</H6>
            <Typography variant="h4" color="info.main">
              {olts.length > 0
                ? Math.round(
                    (olts.filter((olt) => olt.status === 'online').length / olts.length) *
                      100
                  )
                : 0}
              %
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
                    olts.map((olt, index) => (
                      <TableRow key={olt.id} hover>
                        <TableCell>{index + 1}</TableCell>
                        <TableCell>
                          <Typography fontWeight={500}>{olt.serial_number}</Typography>
                        </TableCell>
                        <TableCell>{olt.ip_address}</TableCell>
                        <TableCell>23</TableCell>
                        <TableCell>
                          <Chip label="Desabilitado" color="default" size="small" />
                        </TableCell>
                        <TableCell>{olt.hardware_version || 'N/A'}</TableCell>
                        <TableCell>{olt.software_version || 'N/A'}</TableCell>
                        <TableCell>{getStatusChip(olt.status)}</TableCell>
                        <TableCell align="center">
                          <IconButton
                            color="primary"
                            onClick={() => handleViewClick(olt)}
                            title="Ver detalhes"
                            disabled={!onViewDetails}
                          >
                            <ViewIcon />
                          </IconButton>
                          <IconButton
                            color="error"
                            onClick={() => handleRequestDeleteOLT(olt.id)}
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

