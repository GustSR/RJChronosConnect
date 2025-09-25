import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Chip,
  Container,
  Grid,
  IconButton,
  Skeleton,
  Stack,
  Tooltip,
  Typography,
} from '@mui/material';
import {
  Add as AddIcon,
  Visibility as ViewIcon,
  Delete as DeleteIcon,
  DeviceHub as DeviceHubIcon,
  Refresh as RefreshIcon,
  Close as CloseIcon,
} from '@mui/icons-material';
import { ColumnDef } from '@tanstack/react-table';
import { useNavigate } from 'react-router-dom';
import { H6 } from '@shared/ui/components/Typography';
import { AnimatedCard } from '@shared/ui/components';
import SearchInput from '@shared/ui/components/SearchInput';
import CustomTable from '@features/CustomTable';
import { genieacsApi } from '@shared/api/genieacsApi';
import { OLT } from '@shared/api/types';
import { useTitle } from '@shared/lib/hooks';

interface OLTTableRow {
  id: string;
  index: number;
  name: string;
  ipAddress: string;
  telnetPort: number;
  iptvStatus: string;
  hardwareVersion: string;
  softwareVersion: string;
  status: string;
}

const OLTManagement: React.FC = () => {
  const navigate = useNavigate();
  const [olts, setOlts] = useState<OLT[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  useTitle('Gerenciamento de OLTs - RJ Chronos');

  const loadOLTs = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await genieacsApi.getOLTs();
      setOlts(data);
    } catch (err) {
      console.error('Erro ao carregar OLTs:', err);
      setError('Erro ao carregar lista de OLTs');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadOLTs();
  }, [loadOLTs]);

  const handleDelete = useCallback(
    async (oltId: string) => {
      if (!window.confirm('Tem certeza que deseja excluir esta OLT?')) {
        return;
      }

      try {
        // TODO: Implementar API para remover OLT
        // await genieacsApi.deleteOLT(oltId);
        await loadOLTs();
      } catch (err) {
        console.error('Erro ao excluir OLT:', err);
        window.alert('Nao foi possivel excluir a OLT. Tente novamente.');
      }
    },
    [loadOLTs]
  );

  const handleView = useCallback(
    (oltId: string) => {
      navigate(`/olts/${oltId}`);
    },
    [navigate]
  );

  const filteredOLTs = useMemo(() => {
    const text = searchTerm.trim().toLowerCase();

    if (!text) {
      return olts;
    }

    return olts.filter((olt) => {
      return [
        olt.serial_number,
        olt.ip_address,
        olt.hardware_version,
        olt.software_version,
      ]
        .filter(Boolean)
        .some((value) => value!.toLowerCase().includes(text));
    });
  }, [olts, searchTerm]);

  const tableData = useMemo<OLTTableRow[]>(
    () =>
      filteredOLTs.map((olt, index) => ({
        id: olt.id,
        index: index + 1,
        name: olt.serial_number,
        ipAddress: olt.ip_address,
        telnetPort: 23,
        iptvStatus: 'Desabilitado',
        hardwareVersion: olt.hardware_version || 'N/A',
        softwareVersion: olt.software_version || 'N/A',
        status: olt.status,
      })),
    [filteredOLTs]
  );

  const getStatusChip = useCallback((status: string) => {
    const color = status === 'online' ? 'success' : 'error';
    return (
      <Chip
        label={status === 'online' ? 'Online' : 'Offline'}
        color={color}
        size="small"
      />
    );
  }, []);

  const columns = useMemo<ColumnDef<OLTTableRow>[]>(
    () => [
      {
        accessorKey: 'index',
        header: '#',
        cell: ({ getValue }) => (
          <Typography fontWeight={600}>{getValue<number>()}</Typography>
        ),
        size: 60,
      },
      {
        accessorKey: 'name',
        header: 'Serial',
        cell: ({ getValue }) => (
          <Typography fontWeight={500}>{getValue<string>()}</Typography>
        ),
      },
      {
        accessorKey: 'ipAddress',
        header: 'IP da OLT',
      },
      {
        accessorKey: 'telnetPort',
        header: 'Porta Telnet/SSH',
      },
      {
        accessorKey: 'iptvStatus',
        header: 'IPTV',
        cell: ({ getValue }) => (
          <Chip label={getValue<string>()} color="default" size="small" />
        ),
      },
      {
        accessorKey: 'hardwareVersion',
        header: 'Hardware Version',
      },
      {
        accessorKey: 'softwareVersion',
        header: 'Software Version',
      },
      {
        accessorKey: 'status',
        header: 'Status',
        cell: ({ getValue }) => getStatusChip(getValue<string>()),
      },
      {
        id: 'actions',
        header: 'Acoes',
        enableSorting: false,
        cell: ({ row }) => (
          <Stack direction="row" spacing={1} justifyContent="center">
            <Tooltip title="Ver detalhes">
              <IconButton
                color="primary"
                onClick={() => handleView(row.original.id)}
                size="small"
              >
                <ViewIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title="Excluir OLT">
              <IconButton
                color="error"
                onClick={() => handleDelete(row.original.id)}
                size="small"
              >
                <DeleteIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Stack>
        ),
      },
    ],
    [getStatusChip, handleDelete, handleView]
  );

  const clearSearch = useCallback(() => setSearchTerm(''), []);

  return (
    <Container maxWidth="xl" sx={{ py: 4, px: 2 }}>
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
              <SearchInput
                placeholder="Buscar OLT por serial ou IP"
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

              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => navigate('/olts/add')}
              >
                Adicionar OLT
              </Button>
            </Stack>
          </Box>
        </AnimatedCard>

        <Grid container spacing={3}>
          <Grid item xs={12} sm={6} md={3}>
            <AnimatedCard delay={100} sx={{ p: 2, textAlign: 'center' }}>
              <DeviceHubIcon color="primary" sx={{ fontSize: 40, mb: 1 }} />
              <H6>Total de OLTs</H6>
              <Typography variant="h4" color="primary">
                {olts.length}
              </Typography>
            </AnimatedCard>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <AnimatedCard delay={200} sx={{ p: 2, textAlign: 'center' }}>
              <DeviceHubIcon color="success" sx={{ fontSize: 40, mb: 1 }} />
              <H6>OLTs Online</H6>
              <Typography variant="h4" color="success.main">
                {olts.filter((olt) => olt.status === 'online').length}
              </Typography>
            </AnimatedCard>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <AnimatedCard delay={300} sx={{ p: 2, textAlign: 'center' }}>
              <DeviceHubIcon color="error" sx={{ fontSize: 40, mb: 1 }} />
              <H6>OLTs Offline</H6>
              <Typography variant="h4" color="error.main">
                {olts.filter((olt) => olt.status !== 'online').length}
              </Typography>
            </AnimatedCard>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <AnimatedCard delay={400} sx={{ p: 2, textAlign: 'center' }}>
              <DeviceHubIcon color="info" sx={{ fontSize: 40, mb: 1 }} />
              <H6>Taxa de Disponibilidade</H6>
              <Typography variant="h4" color="info.main">
                {olts.length > 0
                  ? Math.round(
                      (olts.filter((olt) => olt.status === 'online').length /
                        olts.length) *
                        100
                    )
                  : 0}
                %
              </Typography>
            </AnimatedCard>
          </Grid>
        </Grid>

        {error && (
          <Alert severity="error" sx={{ borderRadius: 2 }}>
            {error}
            <Button
              color="inherit"
              size="small"
              onClick={loadOLTs}
              sx={{ ml: 2 }}
            >
              Tentar novamente
            </Button>
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
          {loading ? (
            <Box p={2}>
              {[...Array(5)].map((_, index) => (
                <Box key={index} mb={2}>
                  <Skeleton
                    variant="rectangular"
                    height={60}
                    sx={{ borderRadius: 1 }}
                  />
                </Box>
              ))}
            </Box>
          ) : tableData.length === 0 ? (
            <Alert severity="info" sx={{ m: 3 }}>
              {searchTerm
                ? 'Nenhuma OLT encontrada com os filtros aplicados.'
                : 'Nenhuma OLT cadastrada no momento.'}
            </Alert>
          ) : (
            <Box sx={{ p: 3 }}>
              <CustomTable
                data={tableData}
                columns={columns}
                hidePagination
                variant="flat"
              />
            </Box>
          )}
        </AnimatedCard>
      </Stack>
    </Container>
  );
};

export default OLTManagement;
