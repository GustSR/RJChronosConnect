import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  TextField,
  Button,
  Chip,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Stack,
  InputAdornment,
  Tooltip,
  Avatar,
  Alert,
} from '@mui/material';
import {
  Search,
  FilterList,
  Visibility,
  Refresh,
  Download,
  SignalCellular4Bar,
  SignalCellular2Bar,
  SignalCellular1Bar,
  SignalCellularOff,
  Circle,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import useTitle from '../hooks/useTitle';
import AnimatedCard from '../components/common/AnimatedCard';
import { useProvisioning } from '../contexts/ProvisioningContext';
import { ProvisionedONU } from 'types/provisioning';

// Interfaces
interface Cliente {
  id: string;
  status: 'online' | 'offline' | 'powered_off' | 'admin_disabled';
  nome: string;
  serialNumber: string;
  oltName: string;
  board: string;
  port: string;
  sinal: number;
  modo: 'routing' | 'bridge';
  vlan: string;
  voip: boolean;
  dataAutenticacao: string;
  tipoOnu: string;
  endereco: string;
  rxPower: number;
}

const Clientes: React.FC = () => {
  useTitle('Clientes - RJ Chronos');
  const navigate = useNavigate();
  const {
    provisionedONUs,
    refreshProvisionedONUs,
    loading: contextLoading,
  } = useProvisioning();

  // Estados
  const [loading, setLoading] = useState(true);
  const [filteredClientes, setFilteredClientes] = useState<Cliente[]>([]);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);

  // Filtros
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [oltFilter, setOltFilter] = useState('all');
  const [boardFilter, setBoardFilter] = useState('all');
  const [portFilter, setPortFilter] = useState('all');
  const [vlanFilter, setVlanFilter] = useState('all');
  const [tipoOnuFilter, setTipoOnuFilter] = useState('all');
  const [sinalFilter, setSinalFilter] = useState('all');

  // Converter ONUs provisionadas para formato de Cliente
  const convertProvisionedToCliente = (onu: ProvisionedONU): Cliente => {
    // Mapear status
    let status: 'online' | 'offline' | 'powered_off' | 'admin_disabled';
    if (onu.status === 'disabled') {
      status = 'admin_disabled';
    } else {
      status = onu.status;
    }

    return {
      id: onu.id,
      status,
      nome: onu.clientName,
      serialNumber: onu.serialNumber,
      oltName: onu.oltName,
      board: `${onu.board}/${onu.port}`,
      port: onu.port.toString(),
      sinal: onu.onuRx,
      modo: onu.onuMode,
      vlan: onu.attachedVlans.join(','),
      voip: onu.voipEnabled || false,
      dataAutenticacao: onu.authorizedAt,
      tipoOnu: onu.onuType,
      endereco: onu.clientAddress,
      rxPower: onu.onuRx,
    };
  };

  // Memoizar clientes para evitar recalculos desnecessários
  const clientes = React.useMemo(
    () => provisionedONUs.map(convertProvisionedToCliente),
    [provisionedONUs]
  );

  useEffect(() => {
    const loadClientes = async () => {
      setLoading(true);
      // Simular carregamento
      await new Promise((resolve) => setTimeout(resolve, 1000));
      setLoading(false);
    };

    loadClientes();
  }, []);

  // Aplicar filtros
  useEffect(() => {
    if (clientes.length === 0) {
      setFilteredClientes([]);
      return;
    }

    let filtered = clientes.filter((cliente) => {
      const matchesSearch =
        cliente.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
        cliente.serialNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        cliente.endereco.toLowerCase().includes(searchTerm.toLowerCase()) ||
        cliente.oltName.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus =
        statusFilter === 'all' || cliente.status === statusFilter;
      const matchesOlt = oltFilter === 'all' || cliente.oltName === oltFilter;
      const matchesBoard =
        boardFilter === 'all' || cliente.board === boardFilter;
      const matchesPort = portFilter === 'all' || cliente.port === portFilter;
      const matchesVlan = vlanFilter === 'all' || cliente.vlan === vlanFilter;
      const matchesTipo =
        tipoOnuFilter === 'all' || cliente.tipoOnu === tipoOnuFilter;

      let matchesSinal = true;
      if (sinalFilter === 'excelente') matchesSinal = cliente.sinal >= -15;
      else if (sinalFilter === 'bom')
        matchesSinal = cliente.sinal >= -20 && cliente.sinal < -15;
      else if (sinalFilter === 'regular')
        matchesSinal = cliente.sinal >= -25 && cliente.sinal < -20;
      else if (sinalFilter === 'ruim') matchesSinal = cliente.sinal < -25;

      return (
        matchesSearch &&
        matchesStatus &&
        matchesOlt &&
        matchesBoard &&
        matchesPort &&
        matchesVlan &&
        matchesTipo &&
        matchesSinal
      );
    });

    setFilteredClientes(filtered);
    setPage(0);
  }, [
    clientes,
    searchTerm,
    statusFilter,
    oltFilter,
    boardFilter,
    portFilter,
    vlanFilter,
    tipoOnuFilter,
    sinalFilter,
  ]);

  const handleChangePage = (_event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleViewClient = (clienteId: string) => {
    navigate(`/provisionar/${clienteId}`);
  };

  const getStatusChip = (status: string) => {
    const statusConfig = {
      online: {
        label: 'Online',
        color: 'success' as const,
        icon: <Circle fontSize="small" />,
      },
      offline: {
        label: 'Offline',
        color: 'error' as const,
        icon: <Circle fontSize="small" />,
      },
      powered_off: {
        label: 'Desligado',
        color: 'warning' as const,
        icon: <Circle fontSize="small" />,
      },
      admin_disabled: {
        label: 'Desabilitado',
        color: 'default' as const,
        icon: <Circle fontSize="small" />,
      },
    };

    const config =
      statusConfig[status as keyof typeof statusConfig] || statusConfig.offline;

    return (
      <Chip
        label={config.label}
        color={config.color}
        size="small"
        icon={config.icon}
        variant="filled"
      />
    );
  };

  const getSinalIcon = (sinal: number) => {
    if (sinal >= -15) return <SignalCellular4Bar color="success" />;
    if (sinal >= -20) return <SignalCellular2Bar color="success" />;
    if (sinal >= -25) return <SignalCellular1Bar color="warning" />;
    return <SignalCellularOff color="error" />;
  };

  const getSinalColor = (sinal: number) => {
    if (sinal >= -15) return 'success.main';
    if (sinal >= -20) return 'success.main';
    if (sinal >= -25) return 'warning.main';
    return 'error.main';
  };

  const clearFilters = () => {
    setSearchTerm('');
    setStatusFilter('all');
    setOltFilter('all');
    setBoardFilter('all');
    setPortFilter('all');
    setVlanFilter('all');
    setTipoOnuFilter('all');
    setSinalFilter('all');
  };

  return (
    <Container maxWidth="xl" sx={{ py: 4, px: 2 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" fontWeight="600" sx={{ mb: 1 }}>
          Gerenciamento de Clientes
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Visualize e gerencie todos os equipamentos dos seus clientes
        </Typography>
      </Box>

      {/* Estatísticas */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <AnimatedCard delay={100}>
            <Card
              sx={{
                borderRadius: 4,
                background: 'linear-gradient(145deg, #ffffff 0%, #f8fafc 100%)',
                border: '1px solid #e2e8f0',
                boxShadow: '0 4px 20px rgba(99, 102, 241, 0.08)',
                position: 'relative',
                overflow: 'hidden',
                '&::before': {
                  content: '""',
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  height: '4px',
                  background: 'linear-gradient(90deg, #6366f1, #8b5cf6)',
                },
              }}
            >
              <CardContent sx={{ p: 3 }}>
                <Typography
                  variant="body2"
                  color="text.secondary"
                  fontWeight={500}
                  sx={{ mb: 1, fontSize: '14px' }}
                >
                  Total de Clientes
                </Typography>
                <Typography
                  variant="h4"
                  fontWeight="700"
                  color="text.primary"
                  sx={{
                    background:
                      'linear-gradient(135deg, #6366f1, rgba(99, 102, 241, 0.7))',
                    backgroundClip: 'text',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                  }}
                >
                  {clientes.length}
                </Typography>
              </CardContent>
            </Card>
          </AnimatedCard>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <AnimatedCard delay={200}>
            <Card
              sx={{
                borderRadius: 4,
                background: 'linear-gradient(145deg, #ffffff 0%, #f8fafc 100%)',
                border: '1px solid #e2e8f0',
                boxShadow: '0 4px 20px rgba(99, 102, 241, 0.08)',
                position: 'relative',
                overflow: 'hidden',
                '&::before': {
                  content: '""',
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  height: '4px',
                  background: 'linear-gradient(90deg, #ef4444, #f97316)',
                },
              }}
            >
              <CardContent sx={{ p: 3 }}>
                <Typography
                  variant="body2"
                  color="text.secondary"
                  fontWeight={500}
                  sx={{ mb: 1, fontSize: '14px' }}
                >
                  Total Offline
                </Typography>
                <Typography
                  variant="h4"
                  fontWeight="700"
                  color="text.primary"
                  sx={{
                    background:
                      'linear-gradient(135deg, #ef4444, rgba(239, 68, 68, 0.7))',
                    backgroundClip: 'text',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                  }}
                >
                  {clientes.filter((c) => c.status === 'offline').length}
                </Typography>
              </CardContent>
            </Card>
          </AnimatedCard>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <AnimatedCard delay={300}>
            <Card
              sx={{
                borderRadius: 4,
                background: 'linear-gradient(145deg, #ffffff 0%, #f8fafc 100%)',
                border: '1px solid #e2e8f0',
                boxShadow: '0 4px 20px rgba(99, 102, 241, 0.08)',
                position: 'relative',
                overflow: 'hidden',
                '&::before': {
                  content: '""',
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  height: '4px',
                  background: 'linear-gradient(90deg, #10b981, #059669)',
                },
              }}
            >
              <CardContent sx={{ p: 3 }}>
                <Typography
                  variant="body2"
                  color="text.secondary"
                  fontWeight={500}
                  sx={{ mb: 1, fontSize: '14px' }}
                >
                  Total Online
                </Typography>
                <Typography
                  variant="h4"
                  fontWeight="700"
                  color="text.primary"
                  sx={{
                    background:
                      'linear-gradient(135deg, #10b981, rgba(16, 185, 129, 0.7))',
                    backgroundClip: 'text',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                  }}
                >
                  {clientes.filter((c) => c.status === 'online').length}
                </Typography>
              </CardContent>
            </Card>
          </AnimatedCard>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <AnimatedCard delay={400}>
            <Card
              sx={{
                borderRadius: 4,
                background: 'linear-gradient(145deg, #ffffff 0%, #f8fafc 100%)',
                border: '1px solid #e2e8f0',
                boxShadow: '0 4px 20px rgba(99, 102, 241, 0.08)',
                position: 'relative',
                overflow: 'hidden',
                '&::before': {
                  content: '""',
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  height: '4px',
                  background: 'linear-gradient(90deg, #f59e0b, #d97706)',
                },
              }}
            >
              <CardContent sx={{ p: 3 }}>
                <Typography
                  variant="body2"
                  color="text.secondary"
                  fontWeight={500}
                  sx={{ mb: 1, fontSize: '14px' }}
                >
                  Com Avisos
                </Typography>
                <Typography
                  variant="h4"
                  fontWeight="700"
                  color="text.primary"
                  sx={{
                    background:
                      'linear-gradient(135deg, #f59e0b, rgba(245, 158, 11, 0.7))',
                    backgroundClip: 'text',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                  }}
                >
                  {
                    clientes.filter(
                      (c) =>
                        c.status === 'powered_off' ||
                        c.status === 'admin_disabled' ||
                        c.sinal < -25
                    ).length
                  }
                </Typography>
              </CardContent>
            </Card>
          </AnimatedCard>
        </Grid>
      </Grid>

      {/* Filtros */}
      <AnimatedCard delay={500} sx={{ mb: 4, borderRadius: 3, boxShadow: 2 }}>
        <Box sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
            <FilterList sx={{ mr: 1, color: 'primary.main' }} />
            <Typography variant="h6" fontWeight="600">
              Filtros de Pesquisa
            </Typography>
            <Stack direction="row" spacing={1} sx={{ ml: 'auto' }}>
              <Button
                onClick={refreshProvisionedONUs}
                size="small"
                disabled={contextLoading}
                startIcon={<Refresh />}
                variant="outlined"
              >
                Atualizar
              </Button>
              <Button
                onClick={clearFilters}
                size="small"
                startIcon={<FilterList />}
              >
                Limpar Filtros
              </Button>
            </Stack>
          </Box>

          {/* Linha principal de filtros - tudo compacto em uma linha */}
          <Grid container spacing={2} alignItems="center">
            {/* Busca - aumentado para ocupar todo o espaço disponível */}
            <Grid item xs={12} md={3.2}>
              <TextField
                fullWidth
                size="small"
                label="Pesquisar"
                placeholder="Nome, SN, Endereço..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Search />
                    </InputAdornment>
                  ),
                }}
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
              />
            </Grid>

            {/* Status */}
            <Grid item xs={6} sm={3} md={1.3}>
              <FormControl fullWidth size="small">
                <InputLabel>Status</InputLabel>
                <Select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  label="Status"
                  sx={{ borderRadius: 2 }}
                >
                  <MenuItem value="all">Todos</MenuItem>
                  <MenuItem value="online">Online</MenuItem>
                  <MenuItem value="offline">Offline</MenuItem>
                  <MenuItem value="powered_off">Powered Off</MenuItem>
                  <MenuItem value="admin_disabled">Admin Disabled</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            {/* OLT */}
            <Grid item xs={6} sm={3} md={1.4}>
              <FormControl fullWidth size="small">
                <InputLabel>OLT</InputLabel>
                <Select
                  value={oltFilter}
                  onChange={(e) => setOltFilter(e.target.value)}
                  label="OLT"
                  sx={{ borderRadius: 2 }}
                >
                  <MenuItem value="all">Todas</MenuItem>
                  <MenuItem value="OLT-Central-01">Central-01</MenuItem>
                  <MenuItem value="OLT-Central-02">Central-02</MenuItem>
                  <MenuItem value="OLT-Norte-01">Norte-01</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            {/* Board */}
            <Grid item xs={4} sm={2} md={1.1}>
              <FormControl fullWidth size="small">
                <InputLabel>Board</InputLabel>
                <Select
                  value={boardFilter}
                  onChange={(e) => setBoardFilter(e.target.value)}
                  label="Board"
                  sx={{ borderRadius: 2 }}
                >
                  <MenuItem value="all">Todas</MenuItem>
                  <MenuItem value="1/1">1/1</MenuItem>
                  <MenuItem value="1/2">1/2</MenuItem>
                  <MenuItem value="2/1">2/1</MenuItem>
                  <MenuItem value="2/2">2/2</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            {/* Port */}
            <Grid item xs={4} sm={2} md={1.1}>
              <FormControl fullWidth size="small">
                <InputLabel>Port</InputLabel>
                <Select
                  value={portFilter}
                  onChange={(e) => setPortFilter(e.target.value)}
                  label="Port"
                  sx={{ borderRadius: 2 }}
                >
                  <MenuItem value="all">Todas</MenuItem>
                  {[...Array(16)].map((_, i) => (
                    <MenuItem key={i + 1} value={(i + 1).toString()}>
                      {i + 1}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            {/* VLAN */}
            <Grid item xs={4} sm={2} md={1.1}>
              <FormControl fullWidth size="small">
                <InputLabel>VLAN</InputLabel>
                <Select
                  value={vlanFilter}
                  onChange={(e) => setVlanFilter(e.target.value)}
                  label="VLAN"
                  sx={{ borderRadius: 2 }}
                >
                  <MenuItem value="all">Todas</MenuItem>
                  <MenuItem value="105">105</MenuItem>
                  <MenuItem value="106">106</MenuItem>
                  <MenuItem value="107">107</MenuItem>
                  <MenuItem value="108">108</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            {/* Tipo ONU */}
            <Grid item xs={6} sm={3} md={1.3}>
              <FormControl fullWidth size="small">
                <InputLabel>Tipo ONU</InputLabel>
                <Select
                  value={tipoOnuFilter}
                  onChange={(e) => setTipoOnuFilter(e.target.value)}
                  label="Tipo ONU"
                  sx={{ borderRadius: 2 }}
                >
                  <MenuItem value="all">Todos</MenuItem>
                  <MenuItem value="Huawei HG8245H">HG8245H</MenuItem>
                  <MenuItem value="Fiberhome AN5506">AN5506</MenuItem>
                  <MenuItem value="ZTE F670L">F670L</MenuItem>
                  <MenuItem value="Nokia G-140W-C">G-140W-C</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            {/* Qualidade Sinal */}
            <Grid item xs={6} sm={3} md={1.2}>
              <FormControl fullWidth size="small">
                <InputLabel>Sinal</InputLabel>
                <Select
                  value={sinalFilter}
                  onChange={(e) => setSinalFilter(e.target.value)}
                  label="Sinal"
                  sx={{ borderRadius: 2 }}
                >
                  <MenuItem value="all">Todos</MenuItem>
                  <MenuItem value="excelente">Excelente</MenuItem>
                  <MenuItem value="bom">Bom</MenuItem>
                  <MenuItem value="regular">Regular</MenuItem>
                  <MenuItem value="ruim">Ruim</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </Box>
      </AnimatedCard>

      {/* Tabela */}
      <AnimatedCard delay={600} sx={{ borderRadius: 3, boxShadow: 2, mt: 2 }}>
        <Box sx={{ p: 0 }}>
          <Box sx={{ p: 3, borderBottom: '1px solid', borderColor: 'divider' }}>
            <Stack
              direction="row"
              justifyContent="space-between"
              alignItems="center"
            >
              <Typography variant="h6" fontWeight="600">
                Lista de Clientes ({filteredClientes.length})
              </Typography>
              <Button
                startIcon={<Download />}
                variant="outlined"
                size="small"
                sx={{ borderRadius: 2 }}
              >
                Exportar
              </Button>
            </Stack>
          </Box>

          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Cliente</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Serial Number</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>OLT/Board/Port</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Sinal</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Modo</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>VLAN</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>VoIP</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Autenticado</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Tipo ONU</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Ações</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={11} sx={{ textAlign: 'center', py: 4 }}>
                      <Typography>Carregando...</Typography>
                    </TableCell>
                  </TableRow>
                ) : filteredClientes.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={11} sx={{ textAlign: 'center', py: 4 }}>
                      <Alert severity="info" sx={{ mx: 2 }}>
                        Nenhum cliente encontrado com os filtros aplicados
                      </Alert>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredClientes
                    .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                    .map((cliente) => (
                      <TableRow key={cliente.id} hover>
                        <TableCell>{getStatusChip(cliente.status)}</TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <Avatar
                              sx={{
                                width: 32,
                                height: 32,
                                mr: 2,
                                backgroundColor: 'primary.main',
                                fontSize: '14px',
                              }}
                            >
                              {cliente.nome.charAt(0)}
                            </Avatar>
                            <Box>
                              <Typography variant="body2" fontWeight="600">
                                {cliente.nome}
                              </Typography>
                              <Typography
                                variant="caption"
                                color="text.secondary"
                              >
                                {cliente.endereco}
                              </Typography>
                            </Box>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" fontFamily="monospace">
                            {cliente.serialNumber}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" fontWeight="600">
                            {cliente.oltName}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            Board: {cliente.board} | Port: {cliente.port}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            {getSinalIcon(cliente.sinal)}
                            <Typography
                              variant="body2"
                              sx={{
                                ml: 1,
                                color: getSinalColor(cliente.sinal),
                                fontWeight: 600,
                              }}
                            >
                              {cliente.sinal} dBm
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={
                              cliente.modo === 'routing'
                                ? 'Roteamento'
                                : 'Ponte'
                            }
                            size="small"
                            color={
                              cliente.modo === 'routing'
                                ? 'primary'
                                : 'secondary'
                            }
                            variant="outlined"
                          />
                        </TableCell>
                        <TableCell>
                          <Chip label={`VLAN ${cliente.vlan}`} size="small" />
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={cliente.voip ? 'Ativo' : 'Inativo'}
                            size="small"
                            color={cliente.voip ? 'success' : 'default'}
                            variant={cliente.voip ? 'filled' : 'outlined'}
                          />
                        </TableCell>
                        <TableCell>
                          <Typography variant="caption">
                            {new Date(
                              cliente.dataAutenticacao
                            ).toLocaleDateString('pt-BR')}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" sx={{ maxWidth: 120 }}>
                            {cliente.tipoOnu}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Tooltip title="Visualizar Configurações">
                            <IconButton
                              onClick={() => handleViewClient(cliente.id)}
                              color="primary"
                              size="small"
                            >
                              <Visibility />
                            </IconButton>
                          </Tooltip>
                        </TableCell>
                      </TableRow>
                    ))
                )}
              </TableBody>
            </Table>
          </TableContainer>

          <TablePagination
            component="div"
            count={filteredClientes.length}
            page={page}
            onPageChange={handleChangePage}
            rowsPerPage={rowsPerPage}
            onRowsPerPageChange={handleChangeRowsPerPage}
            rowsPerPageOptions={[10, 25, 50, 100]}
            labelRowsPerPage="Linhas por página:"
            labelDisplayedRows={({ from, to, count }) =>
              `${from}-${to} de ${count !== -1 ? count : `mais de ${to}`}`
            }
          />
        </Box>
      </AnimatedCard>
    </Container>
  );
};

export default Clientes;
