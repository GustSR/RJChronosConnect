import React, { useCallback, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Alert,
  Box,
  Button,
  Chip,
  Container,
  FormControl,
  IconButton,
  InputLabel,
  LinearProgress,
  MenuItem,
  Select,
  Stack,
  Tooltip,
  Typography,
} from '@mui/material';
import { ColumnDef } from '@tanstack/react-table';
import {
  CheckCircle,
  Close as CloseIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import { useTitle } from '@shared/lib/hooks';
import { AnimatedCard } from '@shared/ui/components';
import SearchInput from '@shared/ui/components/SearchInput';
import CustomTable from '@features/CustomTable';
import { useProvisioning } from '@features/onu-provisioning';
import { PendingONU } from '@features/onu-provisioning/provisioning';

const TABLE_PAGE_SIZE = 12;

const defaultClientData = {
  client_name: 'Cliente provisorio',
  client_address: 'Endereco a ser configurado',
  service_profile: 'default',
  vlan_id: 100,
  wan_mode: 'dhcp',
};

const Provisioning: React.FC = () => {
  useTitle('Provisionamento - RJ Chronos');

  const navigate = useNavigate();
  const {
    pendingONUs,
    loading,
    error,
    provisionONU,
    rejectONU,
    refreshPendingONUs,
  } = useProvisioning();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedOlt, setSelectedOlt] = useState<string>('all');

  const uniqueOlts = useMemo(() => {
    const names = pendingONUs
      .map((onu) => onu.oltName)
      .filter((name): name is string => Boolean(name));
    return Array.from(new Set(names)).sort();
  }, [pendingONUs]);

  const filteredONUs = useMemo(() => {
    const text = searchTerm.trim().toLowerCase();

    return pendingONUs.filter((onu) => {
      const matchesOlt = selectedOlt === 'all' || onu.oltName === selectedOlt;
      if (!matchesOlt) {
        return false;
      }

      if (!text) {
        return true;
      }

      return [onu.serialNumber, onu.onuType, onu.oltName]
        .filter(Boolean)
        .some((value) => value.toLowerCase().includes(text));
    });
  }, [pendingONUs, searchTerm, selectedOlt]);

  const tableData = useMemo(
    () =>
      filteredONUs.map((onu) => ({
        ...onu,
        ponType: onu.ponType ?? 'GPON',
      })),
    [filteredONUs]
  );

  const handleProvision = useCallback(
    async (onuId: string) => {
      try {
        const success = await provisionONU(onuId, {
          ...defaultClientData,
          client_name: `Cliente ${onuId.slice(-6)}`,
        });

        if (success) {
          navigate(`/clientes/${onuId}/configurar`);
        } else {
          window.alert('Erro ao autorizar ONU. Tente novamente.');
        }
      } catch (err) {
        console.error('Erro no provisionamento:', err);
        window.alert('Erro ao processar provisionamento');
      }
    },
    [navigate, provisionONU]
  );

  const handleReject = useCallback(
    async (onuId: string) => {
      const reason =
        window.prompt('Motivo da rejeicao (opcional):') ||
        'Rejeitada pelo administrador';

      if (!window.confirm('Tem certeza que deseja rejeitar esta ONU?')) {
        return;
      }

      try {
        const success = await rejectONU(onuId, reason);
        if (!success) {
          window.alert('Erro ao rejeitar ONU. Tente novamente.');
        }
      } catch (err) {
        console.error('Erro na rejeicao:', err);
        window.alert('Erro ao processar rejeicao');
      }
    },
    [rejectONU]
  );

  const handleRefresh = useCallback(() => {
    void refreshPendingONUs();
  }, [refreshPendingONUs]);

  const clearSearch = () => setSearchTerm('');

  const columns = useMemo<ColumnDef<PendingONU>[]>(
    () => [
      {
        accessorKey: 'oltName',
        header: 'OLT',
        cell: ({ getValue }) => (
          <Typography variant="body2" fontWeight={600} color="text.primary">
            {getValue<string>()}
          </Typography>
        ),
      },
      {
        id: 'ponType',
        header: 'PON TYPE',
        cell: ({ row }) => (
          <Chip
            label={row.original.ponType ?? 'GPON'}
            color="default"
            size="small"
            variant="outlined"
            sx={{ fontWeight: 600 }}
          />
        ),
      },
      {
        id: 'slot',
        header: 'SLOT',
        cell: ({ row }) => (
          <Typography variant="body2" color="text.secondary">
            {row.original.board}
          </Typography>
        ),
      },
      {
        id: 'pon',
        header: 'PON',
        cell: ({ row }) => (
          <Typography variant="body2" color="text.secondary">
            {row.original.port}
          </Typography>
        ),
      },
      {
        accessorKey: 'serialNumber',
        header: 'Serial Number',
        cell: ({ getValue }) => (
          <Typography
            variant="body2"
            fontFamily="'Roboto Mono', monospace"
            color="text.primary"
          >
            {getValue<string>()}
          </Typography>
        ),
      },
      {
        accessorKey: 'onuType',
        header: 'Type ONU',
        cell: ({ getValue }) => (
          <Typography variant="body2" color="text.primary">
            {getValue<string>()}
          </Typography>
        ),
      },
      {
        id: 'actions',
        header: 'Actions',
        enableSorting: false,
        cell: ({ row }) => (
          <Stack direction="row" spacing={1} justifyContent="center">
            <Button
              size="small"
              variant="contained"
              color="primary"
              startIcon={<CheckCircle fontSize="small" />}
              onClick={() => handleProvision(row.original.id)}
              disabled={loading}
            >
              Provisionar
            </Button>
            <Button
              size="small"
              variant="outlined"
              color="error"
              onClick={() => handleReject(row.original.id)}
              disabled={loading}
              startIcon={<CloseIcon fontSize="small" />}
            >
              Rejeitar
            </Button>
          </Stack>
        ),
      },
    ],
    [handleProvision, handleReject, loading]
  );

  return (
    <Box sx={{ py: 3 }}>
      <Container maxWidth="xl">
        <Stack spacing={3}>
          <AnimatedCard
            delay={100}
            sx={{
              borderRadius: 3,
              boxShadow: 'none',
              '&:hover': { transform: 'none', boxShadow: 'none' },
            }}
          >
            <Box sx={{ p: 3 }}>
              <Stack
                direction={{ xs: 'column', md: 'row' }}
                spacing={2}
                alignItems={{ xs: 'stretch', md: 'center' }}
              >
                <FormControl sx={{ minWidth: 200 }} size="small">
                  <InputLabel id="olt-filter-label">OLT</InputLabel>
                  <Select
                    labelId="olt-filter-label"
                    value={selectedOlt}
                    label="OLT"
                    onChange={(event) =>
                      setSelectedOlt(event.target.value as string)
                    }
                  >
                    <MenuItem value="all">Todas</MenuItem>
                    {uniqueOlts.map((olt) => (
                      <MenuItem key={olt} value={olt}>
                        {olt}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                <Stack
                  direction="row"
                  spacing={1}
                  alignItems="center"
                  sx={{ flex: 1, minWidth: 0 }}
                >
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ whiteSpace: 'nowrap' }}
                  >
                    Buscar:
                  </Typography>
                  <SearchInput
                    placeholder="Serial, modelo ou OLT"
                    value={searchTerm}
                    onChange={(event) => setSearchTerm(event.target.value)}
                    sx={{ flex: 1, maxWidth: { xs: '100%', md: 360 } }}
                    endAdornment={
                      searchTerm ? (
                        <IconButton
                          size="small"
                          onClick={clearSearch}
                          sx={{ color: 'text.disabled' }}
                        >
                          <CloseIcon fontSize="small" />
                        </IconButton>
                      ) : undefined
                    }
                  />
                </Stack>

                <Tooltip title="Atualizar lista">
                  <span>
                    <Button
                      variant="outlined"
                      startIcon={<RefreshIcon />}
                      onClick={handleRefresh}
                      disabled={loading}
                    >
                      Atualizar
                    </Button>
                  </span>
                </Tooltip>
              </Stack>
            </Box>
          </AnimatedCard>

          {error && (
            <Alert severity="error" sx={{ borderRadius: 2 }}>
              {error}
            </Alert>
          )}

          <AnimatedCard
            delay={150}
            sx={{
              borderRadius: 3,
              boxShadow: 'none',
              '&:hover': { transform: 'none', boxShadow: 'none' },
            }}
          >
            {loading && <LinearProgress />}
            <Box sx={{ p: 3 }}>
              {tableData.length === 0 && !loading ? (
                <Alert severity="info" sx={{ borderRadius: 2 }}>
                  {searchTerm || selectedOlt !== 'all'
                    ? 'Nenhuma ONU encontrada com os filtros aplicados.'
                    : 'Nenhuma ONU pendente de autorizacao no momento.'}
                </Alert>
              ) : (
                <CustomTable
                  data={tableData}
                  columns={columns}
                  pageSize={TABLE_PAGE_SIZE}
                  variant="flat"
                />
              )}
            </Box>
          </AnimatedCard>
        </Stack>
      </Container>
    </Box>
  );
};

export default Provisioning;
