import React, { useState } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Chip,
  IconButton,
  Button,
  Avatar,
  useTheme,
  Tabs,
  Tab,
  FormControl,
  Select,
  MenuItem,
  InputLabel,
  Paper,
  Divider,
  Stack,
  Tooltip,
  TextField,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
} from '@mui/material';
import {
  LocationOn,
  Map,
  Satellite,
  MyLocation,
  Search,
  FilterList,
  Refresh,
  Fullscreen,
  Settings,
  Visibility,
  Edit,
  Add,
  Download,
  Print,
  Share,
  Router,
  Devices,
  Wifi,
  SignalWifi4Bar,
  Warning,
  CheckCircle,
  Error,
} from '@mui/icons-material';

// Mock geolocation data
const customerLocations = [
  { 
    id: 'cust-001', 
    name: 'Cliente 001', 
    address: 'Rua das Flores, 123 - Centro', 
    lat: -22.9068, 
    lng: -43.1729, 
    cpe: 'CPE-001', 
    status: 'online',
    signal: -42.5,
    plan: 'Fibra 100MB'
  },
  { 
    id: 'cust-002', 
    name: 'Cliente 002', 
    address: 'Av. Copacabana, 456 - Copacabana', 
    lat: -22.9711, 
    lng: -43.1822, 
    cpe: 'CPE-002', 
    status: 'online',
    signal: -45.2,
    plan: 'Fibra 200MB'
  },
  {
    id: 'cust-003', 
    name: 'Cliente 003', 
    address: 'Rua Ipanema, 789 - Ipanema', 
    lat: -22.9838, 
    lng: -43.2096, 
    cpe: 'CPE-003', 
    status: 'warning',
    signal: -52.8,
    plan: 'Fibra 300MB'
  },
  { 
    id: 'cust-004', 
    name: 'Cliente 004', 
    address: 'Barra da Tijuca, 321 - Barra', 
    lat: -23.0045, 
    lng: -43.3198, 
    cpe: 'CPE-004', 
    status: 'offline',
    signal: null,
    plan: 'Fibra 500MB'
  },
  { 
    id: 'cust-005', 
    name: 'Cliente 005', 
    address: 'Tijuca, 654 - Tijuca', 
    lat: -22.9249, 
    lng: -43.2277, 
    cpe: 'CPE-005', 
    status: 'online',
    signal: -41.3,
    plan: 'Fibra 100MB'
  },
];

const oltLocations = [
  { 
    id: 'olt-001', 
    name: 'OLT Central', 
    address: 'Centro de Dados Principal', 
    lat: -22.9068, 
    lng: -43.1729, 
    status: 'online',
    coverage: 2.5,
    customers: 45
  },
  { 
    id: 'olt-002', 
    name: 'OLT Norte', 
    address: 'Zona Norte', 
    lat: -22.8808, 
    lng: -43.2096, 
    status: 'online',
    coverage: 3.0,
    customers: 38
  },
  { 
    id: 'olt-003', 
    name: 'OLT Sul', 
    address: 'Zona Sul', 
    lat: -22.9711, 
    lng: -43.1822, 
    status: 'warning',
    coverage: 2.8,
    customers: 52
  },
];

const geoStats = {
  totalCustomers: customerLocations.length,
  onlineCustomers: customerLocations.filter(c => c.status === 'online').length,
  warningCustomers: customerLocations.filter(c => c.status === 'warning').length,
  offlineCustomers: customerLocations.filter(c => c.status === 'offline').length,
  totalOLTs: oltLocations.length,
  avgSignal: customerLocations.filter(c => c.signal).reduce((sum, c) => sum + (c.signal || 0), 0) / customerLocations.filter(c => c.signal).length,
};

interface MetricCardProps {
  title: string;
  value: number | string;
  subtitle: string;
  color: 'primary' | 'secondary' | 'success' | 'warning' | 'error';
  icon: React.ElementType;
}

function MetricCard({ title, value, subtitle, color, icon: Icon }: MetricCardProps) {
  const theme = useTheme();
  
  return (
    <Card
      sx={{
        height: '100%',
        background: `linear-gradient(135deg, ${theme.palette[color].main}15 0%, ${theme.palette[color].main}05 100%)`,
        border: `1px solid ${theme.palette[color].main}20`,
      }}
    >
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <Avatar
            sx={{
              bgcolor: `${color}.main`,
              width: 48,
              height: 48,
            }}
          >
            <Icon />
          </Avatar>
        </Box>
        
        <Typography variant="h3" fontWeight={700} color={`${color}.main`} gutterBottom>
          {value}
        </Typography>
        
        <Typography variant="h6" fontWeight={600} gutterBottom>
          {title}
        </Typography>
        
        <Typography variant="body2" color="text.secondary">
          {subtitle}
        </Typography>
      </CardContent>
    </Card>
  );
}

function getStatusChip(status: string) {
  const statusConfig = {
    online: { label: 'Online', color: 'success' as const },
    offline: { label: 'Offline', color: 'error' as const },
    warning: { label: 'Atenção', color: 'warning' as const },
  };
  
  const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.offline;
  
  return (
    <Chip
      label={config.label}
      color={config.color}
      size="small"
      variant="filled"
    />
  );
}

function getStatusIcon(status: string) {
  switch (status) {
    case 'online': return <CheckCircle color="success" fontSize="small" />;
    case 'warning': return <Warning color="warning" fontSize="small" />;
    case 'offline': return <Error color="error" fontSize="small" />;
    default: return <Error color="disabled" fontSize="small" />;
  }
}

export default function Geolocation() {
  const [tabValue, setTabValue] = useState(0);
  const [selectedLocation, setSelectedLocation] = useState<string | null>(null);
  const [mapView, setMapView] = useState('satellite');
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const theme = useTheme();

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const filteredCustomers = customerLocations.filter(customer => {
    const matchesSearch = customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         customer.address.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || customer.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  return (
    <Box>
      {/* Header */}
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <Box>
          <Typography variant="h4" fontWeight={700} gutterBottom>
            🗺️ Georreferenciamento
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Localização geográfica de clientes e infraestrutura
          </Typography>
        </Box>
        
        <Box sx={{ display: 'flex', gap: 2 }}>
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>Visualização</InputLabel>
            <Select
              value={mapView}
              label="Visualização"
              onChange={(e) => setMapView(e.target.value)}
            >
              <MenuItem value="satellite">Satélite</MenuItem>
              <MenuItem value="street">Ruas</MenuItem>
              <MenuItem value="hybrid">Híbrido</MenuItem>
            </Select>
          </FormControl>
          
          <Button variant="outlined" startIcon={<Refresh />}>
            Atualizar
          </Button>
          
          <Button variant="contained" startIcon={<Add />}>
            Adicionar Local
          </Button>
        </Box>
      </Box>

      {/* Metrics Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            title="Total Clientes"
            value={geoStats.totalCustomers}
            subtitle="Localizações mapeadas"
            color="primary"
            icon={LocationOn}
          />
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            title="Clientes Online"
            value={geoStats.onlineCustomers}
            subtitle={`${Math.round((geoStats.onlineCustomers/geoStats.totalCustomers)*100)}% disponibilidade`}
            color="success"
            icon={CheckCircle}
          />
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            title="OLTs Ativas"
            value={geoStats.totalOLTs}
            subtitle="Pontos de distribuição"
            color="secondary"
            icon={Router}
          />
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            title="Sinal Médio"
            value={`${geoStats.avgSignal.toFixed(1)}dBm`}
            subtitle="Qualidade do sinal"
            color="warning"
            icon={SignalWifi4Bar}
          />
        </Grid>
      </Grid>

      {/* Main Content */}
      <Grid container spacing={3}>
        {/* Map View */}
        <Grid item xs={12} lg={8}>
          <Card>
            <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 2 }}>
                <Tabs value={tabValue} onChange={handleTabChange}>
                  <Tab label="🗺️ Mapa Geral" />
                  <Tab label="📡 Cobertura" />
                  <Tab label="📊 Análise" />
                </Tabs>
                
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Tooltip title="Localizar">
                    <IconButton>
                      <MyLocation />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Tela Cheia">
                    <IconButton>
                      <Fullscreen />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Configurações">
                    <IconButton>
                      <Settings />
                    </IconButton>
                  </Tooltip>
                </Box>
              </Box>
            </Box>

            {/* Map Canvas */}
            {tabValue === 0 && (
              <CardContent>
                <Paper
                  sx={{
                    height: 500,
                    position: 'relative',
                    overflow: 'hidden',
                    backgroundColor: theme.palette.mode === 'dark' ? 'grey.900' : 'grey.100',
                    border: `1px solid ${theme.palette.divider}`,
                    borderRadius: 2,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {/* Placeholder for Google Maps or similar */}
                  <Box sx={{ textAlign: 'center' }}>
                    <Map sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
                    <Typography variant="h6" color="text.secondary" gutterBottom>
                      Mapa Interativo
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Integração com Google Maps/OpenStreetMap será implementada aqui
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                      📍 {customerLocations.length} clientes mapeados
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      📡 {oltLocations.length} OLTs posicionadas
                    </Typography>
                  </Box>
                  
                  {/* Legend */}
                  <Box
                    sx={{
                      position: 'absolute',
                      top: 16,
                      right: 16,
                      backgroundColor: theme.palette.background.paper,
                      p: 2,
                      borderRadius: 1,
                      border: `1px solid ${theme.palette.divider}`,
                    }}
                  >
                    <Typography variant="subtitle2" fontWeight={600} gutterBottom>
                      Legenda
                    </Typography>
                    <Stack spacing={1}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <CheckCircle color="success" fontSize="small" />
                        <Typography variant="caption">Cliente Online</Typography>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Warning color="warning" fontSize="small" />
                        <Typography variant="caption">Cliente com Problema</Typography>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Error color="error" fontSize="small" />
                        <Typography variant="caption">Cliente Offline</Typography>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Router color="primary" fontSize="small" />
                        <Typography variant="caption">OLT</Typography>
                      </Box>
                    </Stack>
                  </Box>
                </Paper>
              </CardContent>
            )}

            {/* Coverage Tab */}
            {tabValue === 1 && (
              <CardContent>
                <Typography variant="h6" fontWeight={600} gutterBottom>
                  Análise de Cobertura
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                  Mapa de calor da cobertura e qualidade do sinal
                </Typography>
                
                <Grid container spacing={2}>
                  {oltLocations.map((olt) => (
                    <Grid item xs={12} md={4} key={olt.id}>
                      <Card variant="outlined">
                        <CardContent>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                            <Avatar sx={{ bgcolor: 'primary.main' }}>
                              <Router />
                            </Avatar>
                            <Box>
                              <Typography variant="subtitle1" fontWeight={600}>
                                {olt.name}
                              </Typography>
                              {getStatusChip(olt.status)}
                            </Box>
                          </Box>
                          <Typography variant="body2" color="text.secondary">
                            Cobertura: {olt.coverage}km
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Clientes: {olt.customers}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {olt.address}
                          </Typography>
                        </CardContent>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
              </CardContent>
            )}

            {/* Analysis Tab */}
            {tabValue === 2 && (
              <CardContent>
                <Typography variant="h6" fontWeight={600} gutterBottom>
                  Análise Geográfica
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Relatórios e estatísticas baseadas em localização serão implementados aqui.
                </Typography>
              </CardContent>
            )}
          </Card>
        </Grid>

        {/* Customer List */}
        <Grid item xs={12} lg={4}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6" fontWeight={600}>
                  Clientes
                </Typography>
                <Chip label={`${filteredCustomers.length} encontrados`} color="primary" variant="outlined" />
              </Box>
              
              {/* Search and Filter */}
              <Box sx={{ mb: 2 }}>
                <TextField
                  fullWidth
                  size="small"
                  placeholder="Buscar cliente..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  InputProps={{
                    startAdornment: <Search sx={{ mr: 1, color: 'text.secondary' }} />,
                  }}
                  sx={{ mb: 2 }}
                />
                
                <FormControl fullWidth size="small">
                  <InputLabel>Status</InputLabel>
                  <Select
                    value={filterStatus}
                    label="Status"
                    onChange={(e) => setFilterStatus(e.target.value)}
                  >
                    <MenuItem value="all">Todos</MenuItem>
                    <MenuItem value="online">Online</MenuItem>
                    <MenuItem value="warning">Atenção</MenuItem>
                    <MenuItem value="offline">Offline</MenuItem>
                  </Select>
                </FormControl>
              </Box>
              
              {/* Customer List */}
              <List sx={{ maxHeight: 400, overflow: 'auto' }}>
                {filteredCustomers.map((customer) => (
                  <ListItem
                    key={customer.id}
                    sx={{
                      border: `1px solid ${theme.palette.divider}`,
                      borderRadius: 1,
                      mb: 1,
                      cursor: 'pointer',
                      '&:hover': {
                        backgroundColor: theme.palette.action.hover,
                      },
                    }}
                    onClick={() => setSelectedLocation(customer.id)}
                  >
                    <ListItemAvatar>
                      <Avatar sx={{ bgcolor: 'primary.main' }}>
                        {getStatusIcon(customer.status)}
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Typography variant="subtitle2" fontWeight={600}>
                            {customer.name}
                          </Typography>
                          {getStatusChip(customer.status)}
                        </Box>
                      }
                      secondary={
                        <Box>
                          <Typography variant="caption" color="text.secondary">
                            {customer.address}
                          </Typography>
                          <br />
                          <Typography variant="caption" color="text.secondary">
                            {customer.plan} • {customer.signal ? `${customer.signal}dBm` : 'Sem sinal'}
                          </Typography>
                        </Box>
                      }
                    />
                  </ListItem>
                ))}
              </List>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}