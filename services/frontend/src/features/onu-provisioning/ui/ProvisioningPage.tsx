import React, { useCallback, useMemo, useState } from 'react';
import { Add, CheckCircle, FilterList, Refresh, Schedule, Search, TrendingUp, Warning } from '@mui/icons-material';
import { Alert, Box, Button, Chip, Container, Dialog, DialogActions, DialogContent, DialogTitle, FormControl, FormHelperText, Grid, InputAdornment, InputLabel, LinearProgress, MenuItem, Paper, Select, Snackbar, TextField, Typography } from '@mui/material';
import { AnimatedCard, PromptDialog } from '@shared/ui/components';
import PendingOnuCard from '@entities/onu/ui/PendingOnuCard';
import type { PendingONU, ProvisionedONU } from '../provisioning';

type Props = {
  pendingONUs: PendingONU[];
  provisionedONUs: ProvisionedONU[];
  loading: boolean;
  error: string | null;
  onRefresh: () => Promise<void> | void;
  onProvision: (
    onuId: string,
    data: {
      client_name: string;
      client_cpf_cnpj?: string;
      client_address: string;
      service_profile?: string;
      vlan_id?: number;
      wan_mode?: string;
    }
  ) => Promise<{ success: boolean; message?: string; genieacsAvailable?: boolean }>;
  onReject: (onuId: string, reason?: string) => Promise<boolean>;
  onNavigateToConfig: (onuId: string) => void;
};

export const ProvisioningPage: React.FC<Props> = ({
  pendingONUs,
  provisionedONUs,
  loading,
  error,
  onRefresh,
  onProvision,
  onReject,
  onNavigateToConfig,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [oltFilter, setOltFilter] = useState<string>('all');

  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [rejectOnuId, setRejectOnuId] = useState<string>('');
  const [rejectReason, setRejectReason] = useState('');

  const [provisionDialogOpen, setProvisionDialogOpen] = useState(false);
  const [provisionOnuId, setProvisionOnuId] = useState<string>('');
  const [provisionFormTouched, setProvisionFormTouched] = useState(false);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');
  const [provisionForm, setProvisionForm] = useState({
    client_name: '',
    client_cpf_cnpj: '',
    client_address: '',
  });

  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error' | 'info';
  }>({ open: false, message: '', severity: 'info' });

  const closeSnackbar = () => setSnackbar((prev) => ({ ...prev, open: false }));

  const filteredONUs = useMemo(() => {
    return pendingONUs.filter((onu) => {
      const matchesSearch =
        onu.serialNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        onu.onuType.toLowerCase().includes(searchTerm.toLowerCase()) ||
        onu.oltName.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus = statusFilter === 'all' || onu.status === statusFilter;
      const matchesOlt = oltFilter === 'all' || onu.oltName === oltFilter;

      return matchesSearch && matchesStatus && matchesOlt;
    });
  }, [pendingONUs, searchTerm, statusFilter, oltFilter]);

  const stats = useMemo(
    () => ({
      total: pendingONUs.length,
      pending: pendingONUs.filter((onu) => onu.status === 'pending').length,
      authorized: pendingONUs.filter((onu) => onu.status === 'authorized').length,
      failed: pendingONUs.filter((onu) => onu.status === 'failed').length,
    }),
    [pendingONUs]
  );

  const uniqueOlts = useMemo(() => [...new Set(pendingONUs.map((onu) => onu.oltName))], [pendingONUs]);
  const mockCustomers = useMemo(() => {
    const seen = new Set<string>();
    return provisionedONUs.reduce(
      (acc, onu) => {
        const name = onu.clientName?.trim();
        if (!name) {
          return acc;
        }
        const address = onu.clientAddress?.trim() || 'Endereco nao informado';
        const key = `${name}||${address}`;
        if (seen.has(key)) {
          return acc;
        }
        seen.add(key);
        acc.push({
          id: onu.id,
          name,
          address,
          cpfCnpj: undefined,
        });
        return acc;
      },
      [] as Array<{ id: string; name: string; address: string; cpfCnpj?: string }>
    );
  }, [provisionedONUs]);

  const openProvisionDialog = useCallback(
    (onuId: string) => {
      setProvisionOnuId(onuId);
      setProvisionFormTouched(false);
      setSelectedCustomerId('');
      setProvisionForm({ client_name: '', client_cpf_cnpj: '', client_address: '' });
      setProvisionDialogOpen(true);
    },
    []
  );

  const closeProvisionDialog = useCallback(() => {
    setProvisionDialogOpen(false);
    setProvisionOnuId('');
    setProvisionFormTouched(false);
    setSelectedCustomerId('');
  }, []);

  const handleCustomerChange = useCallback(
    (customerId: string) => {
      setSelectedCustomerId(customerId);
      const selectedCustomer = mockCustomers.find((customer) => customer.id === customerId);
      setProvisionForm((prev) => ({
        ...prev,
        client_name: selectedCustomer?.name ?? '',
        client_address: selectedCustomer?.address ?? '',
        client_cpf_cnpj: selectedCustomer?.cpfCnpj ?? '',
      }));
    },
    [mockCustomers]
  );

  const handleProvision = useCallback(
    async (onuId: string) => {
      try {
        setProvisionFormTouched(true);
        const clientName = provisionForm.client_name.trim();
        const clientAddress = provisionForm.client_address.trim();
        if (!clientName || !clientAddress) {
          return;
        }

        const result = await onProvision(onuId, {
          client_name: clientName,
          client_cpf_cnpj: provisionForm.client_cpf_cnpj.trim() || undefined,
          client_address: clientAddress,
          service_profile: 'default',
          vlan_id: 100,
          wan_mode: 'dhcp',
        });

        if (result.success) {
          setSnackbar({
            open: true,
            severity: result.genieacsAvailable ? 'success' : 'info',
            message: result.message || 'Provisionamento concluído.',
          });
          if (result.genieacsAvailable) {
            onNavigateToConfig(onuId);
          }
          closeProvisionDialog();
        } else {
          setSnackbar({
            open: true,
            severity: 'error',
            message: result.message || 'Erro ao autorizar ONU. Tente novamente.',
          });
        }
      } catch (caught) {
        console.error('Erro no provisionamento:', caught);
        const message =
          caught instanceof Error
            ? caught.message
            : 'Erro ao processar provisionamento';
        setSnackbar({ open: true, severity: 'error', message });
      }
    },
    [closeProvisionDialog, onNavigateToConfig, onProvision, provisionForm]
  );

  const customerError = provisionFormTouched && !selectedCustomerId;
  const addressError = provisionFormTouched && !provisionForm.client_address.trim();

  const openRejectDialog = useCallback((onuId: string) => {
    setRejectOnuId(onuId);
    setRejectReason('');
    setRejectDialogOpen(true);
  }, []);

  const closeRejectDialog = useCallback(() => {
    setRejectDialogOpen(false);
    setRejectOnuId('');
    setRejectReason('');
  }, []);

  const confirmReject = useCallback(async () => {
    if (!rejectOnuId) return;
    try {
      const reason = rejectReason.trim() || 'Rejeitada pelo administrador';
      const success = await onReject(rejectOnuId, reason);

      if (success) {
        setSnackbar({ open: true, severity: 'success', message: 'ONU rejeitada com sucesso' });
      } else {
        setSnackbar({ open: true, severity: 'error', message: 'Erro ao rejeitar ONU. Tente novamente.' });
      }
    } catch (caught) {
      console.error('Erro na rejeição:', caught);
      setSnackbar({ open: true, severity: 'error', message: 'Erro ao processar rejeição' });
    } finally {
      closeRejectDialog();
    }
  }, [closeRejectDialog, onReject, rejectOnuId, rejectReason]);

  return (
    <Box sx={{ bgcolor: '#fafafa', minHeight: '100vh', py: 3 }}>
      <Container maxWidth="xl">
        <Box sx={{ mb: 1 }} />

        <AnimatedCard
          delay={100}
          sx={{
            p: 2,
            borderRadius: 3,
            mb: 3,
            '&:hover': {
              transform: 'translateY(0px)',
              boxShadow:
                '0px 2px 1px -1px rgba(107, 114, 128, 0.03), 0px 1px 1px 0px rgba(107, 114, 128, 0.04), 0px 1px 3px 0px rgba(107, 114, 128, 0.08)',
            },
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2, mb: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <FilterList sx={{ mr: 1, color: '#6b7280', fontSize: 20 }} />
              <Typography variant="body1" fontWeight="600" sx={{ mr: 3 }}>
                Filtros
              </Typography>
              <Chip label={`${filteredONUs.length} resultados`} color="primary" variant="outlined" size="small" sx={{ fontWeight: 600 }} />
            </Box>

            <Box sx={{ display: 'flex', gap: 2 }}>
              <Button
                variant="outlined"
                startIcon={<Refresh />}
                onClick={onRefresh}
                size="small"
                sx={{
                  borderRadius: 3,
                  textTransform: 'none',
                  fontWeight: 500,
                  '&:hover': { transform: 'none' },
                }}
              >
                Atualizar
              </Button>
              <Button
                variant="contained"
                startIcon={<Add />}
                size="small"
                sx={{
                  borderRadius: 3,
                  textTransform: 'none',
                  fontWeight: 600,
                  background: 'linear-gradient(135deg, #6366f1, #5855eb)',
                  boxShadow: 'none',
                  '&:hover': { background: 'linear-gradient(135deg, #5855eb, #4f46e5)', boxShadow: 'none', transform: 'none' },
                }}
              >
                Adicionar Manual
              </Button>
            </Box>
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
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 3 } }}
              />
            </Grid>

            <Grid item xs={12} md={3}>
              <FormControl fullWidth size="small">
                <InputLabel>Status</InputLabel>
                <Select value={statusFilter} label="Status" onChange={(e) => setStatusFilter(e.target.value)} sx={{ borderRadius: 3 }} MenuProps={{ disableScrollLock: true }}>
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
                <Select value={oltFilter} label="OLT" onChange={(e) => setOltFilter(e.target.value)} sx={{ borderRadius: 3 }} MenuProps={{ disableScrollLock: true }}>
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

        {loading ? (
          <AnimatedCard delay={150} sx={{ mb: 3 }}>
            <Alert severity="info" icon={<LinearProgress sx={{ width: 20, mr: 1 }} />}>
              Carregando ONUs pendentes do GenieACS...
            </Alert>
          </AnimatedCard>
        ) : null}

        {error ? (
          <AnimatedCard delay={150} sx={{ mb: 3 }}>
            <Alert severity="error" sx={{ borderRadius: 3 }}>
              {error}
            </Alert>
          </AnimatedCard>
        ) : null}

        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={6} md={3}>
            <AnimatedCard delay={200} disableHoverEffect={true} sx={{ boxShadow: 'none !important', bgcolor: 'transparent !important' }}>
              <Paper sx={{ p: 3, borderRadius: 3, textAlign: 'center', boxShadow: 'none', border: '1px solid #f0f0f0' }}>
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
            <AnimatedCard delay={300} disableHoverEffect={true} sx={{ boxShadow: 'none !important', bgcolor: 'transparent !important' }}>
              <Paper sx={{ p: 3, borderRadius: 3, textAlign: 'center', boxShadow: 'none', border: '1px solid #f0f0f0' }}>
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
            <AnimatedCard delay={400} disableHoverEffect={true} sx={{ boxShadow: 'none !important', bgcolor: 'transparent !important' }}>
              <Paper sx={{ p: 3, borderRadius: 3, textAlign: 'center', boxShadow: 'none', border: '1px solid #f0f0f0' }}>
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
            <AnimatedCard delay={500} disableHoverEffect={true} sx={{ boxShadow: 'none !important', bgcolor: 'transparent !important' }}>
              <Paper sx={{ p: 3, borderRadius: 3, textAlign: 'center', boxShadow: 'none', border: '1px solid #f0f0f0' }}>
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

        {filteredONUs.length === 0 ? (
          <AnimatedCard delay={600}>
            <Alert severity="info" sx={{ borderRadius: 3, fontSize: '16px', py: 2 }}>
              {searchTerm || statusFilter !== 'all' || oltFilter !== 'all'
                ? 'Nenhuma ONU encontrada com os filtros aplicados.'
                : 'Nenhuma ONU pendente de autorização no momento.'}
            </Alert>
          </AnimatedCard>
        ) : (
          <Grid container spacing={3}>
            {filteredONUs.map((onu, index) => (
              <Grid item xs={12} md={6} lg={4} key={onu.id}>
                <AnimatedCard delay={600 + index * 100} disableHoverEffect={true} sx={{ boxShadow: 'none !important', bgcolor: 'transparent !important' }}>
                  <PendingOnuCard onu={onu} onProvision={openProvisionDialog} onReject={openRejectDialog} />
                </AnimatedCard>
              </Grid>
            ))}
          </Grid>
        )}
      </Container>

      <Dialog
        open={provisionDialogOpen}
        onClose={closeProvisionDialog}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Vincular cliente antes do provisionamento</DialogTitle>
        <DialogContent sx={{ pt: 1 }}>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Informe os dados do cliente para concluir o provisionamento.
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <FormControl fullWidth required error={customerError}>
                <InputLabel id="provisioning-customer-label">Cliente</InputLabel>
                <Select
                  labelId="provisioning-customer-label"
                  label="Cliente"
                  value={selectedCustomerId}
                  onChange={(event) => handleCustomerChange(event.target.value)}
                  MenuProps={{ disableScrollLock: true }}
                  disabled={mockCustomers.length === 0}
                >
                  {mockCustomers.map((customer) => (
                    <MenuItem key={customer.id} value={customer.id}>
                      {customer.name}
                    </MenuItem>
                  ))}
                </Select>
                <FormHelperText>
                  {customerError ? 'Selecione um cliente.' : ' '}
                </FormHelperText>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="CPF/CNPJ (opcional)"
                value={provisionForm.client_cpf_cnpj}
                onChange={(event) =>
                  setProvisionForm((prev) => ({
                    ...prev,
                    client_cpf_cnpj: event.target.value,
                  }))
                }
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                required
                label="Endereco"
                value={provisionForm.client_address}
                InputProps={{ readOnly: true }}
                error={addressError}
                helperText={addressError ? 'Informe o endereco do cliente.' : ' '}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={closeProvisionDialog} variant="outlined">
            Cancelar
          </Button>
          <Button
            onClick={() => handleProvision(provisionOnuId)}
            variant="contained"
            disabled={!provisionOnuId || !selectedCustomerId}
          >
            Provisionar
          </Button>
        </DialogActions>
      </Dialog>

      <PromptDialog
        open={rejectDialogOpen}
        title="Rejeitar ONU"
        label="Motivo (opcional)"
        value={rejectReason}
        placeholder="Ex.: Equipamento não autorizado"
        confirmText="Rejeitar"
        cancelText="Cancelar"
        onChange={setRejectReason}
        onConfirm={confirmReject}
        onClose={closeRejectDialog}
      />

      <Snackbar open={snackbar.open} autoHideDuration={4000} onClose={closeSnackbar}>
        <Alert onClose={closeSnackbar} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};
