import React, { useState } from 'react';
import {
  Box,
  Grid,
  CardContent,
  Typography,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  TextField,
  InputAdornment,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Tabs,
  Tab,
  LinearProgress,
} from '@mui/material';
import BerryCard from '../components/common/BerryCard';
import MetricCard from '../components/common/MetricCard';
import StatusChip from '../components/common/StatusChip';
import {
  Storage,
  Devices,
  Router,
  Visibility,
  Edit,
  Delete,
  Search,
  Add,
  FilterList,
  Download,
  Refresh,
  SignalWifi4Bar,
  NetworkCheck,
  DeviceHub,
} from '@mui/icons-material';

// Mock data seguindo padrão Berry
const mockDevices = {
  cpes: 1247,
  onus: 856,
  olts: 12,
  switches: 45,
  total: 2160,
};

const mockCPEs = [
  { id: 'CPE001', model: 'Intelbras IWR 3000N', status: 'online', customer: 'João Silva', signal: -42.5, location: 'Copacabana', lastSeen: '2 min', firmware: '1.2.3' },
  { id: 'CPE002', model: 'TP-Link Archer C6', status: 'offline', customer: 'Maria Santos', signal: -48.2, location: 'Ipanema', lastSeen: '15 min', firmware: '1.1.8' },
  { id: 'CPE003', model: 'Intelbras IWR 3000N', status: 'online', customer: 'Pedro Costa', signal: -45.1, location: 'Leblon', lastSeen: '1 min', firmware: '1.2.3' },
  { id: 'CPE004', model: 'TP-Link Archer C6', status: 'warning', customer: 'Ana Oliveira', signal: -52.8, location: 'Barra', lastSeen: '5 min', firmware: '1.1.5' },
  { id: 'CPE005', model: 'Intelbras IWR 3000N', status: 'online', customer: 'Carlos Lima', signal: -41.3, location: 'Tijuca', lastSeen: '3 min', firmware: '1.2.3' },
  { id: 'CPE006', model: 'Huawei HG8245H', status: 'online', customer: 'Lucia Ferreira', signal: -39.8, location: 'Centro', lastSeen: '1 min', firmware: '2.1.0' },
  { id: 'CPE007', model: 'ZTE F670L', status: 'maintenance', customer: 'Roberto Alves', signal: -55.2, location: 'Madureira', lastSeen: '30 min', firmware: '1.8.2' },
  { id: 'CPE008', model: 'Intelbras IWR 3000N', status: 'online', customer: 'Fernanda Rocha', signal: -44.7, location: 'Botafogo', lastSeen: '2 min', firmware: '1.2.3' },
];

const mockONUs = [
  { id: 'ONU001', model: 'Huawei HG8310M', status: 'online', customer: 'Edifício Solar', signal: -18.5, location: 'Copacabana', ports: '4/4', uptime: '15d 8h' },
  { id: 'ONU002', model: 'ZTE F601', status: 'online', customer: 'Condomínio Vista Mar', signal: -22.1, location: 'Ipanema', ports: '3/4', uptime: '8d 12h' },
  { id: 'ONU003', model: 'Intelbras ITO 4P', status: 'warning', customer: 'Prédio Comercial', signal: -28.3, location: 'Centro', ports: '4/4', uptime: '2d 4h' },
];

const mockOLTs = [
  { id: 'OLT001', model: 'Huawei MA5608T', status: 'online', location: 'Central Copacabana', ports: '128/128', onus: 89, uptime: '45d 12h', temperature: '42°C' },
  { id: 'OLT002', model: 'ZTE C320', status: 'online', location: 'Central Barra', ports: '96/128', onus: 67, uptime: '32d 8h', temperature: '38°C' },
  { id: 'OLT003', model: 'Intelbras OLT 8820i', status: 'maintenance', location: 'Central Tijuca', ports: '64/64', onus: 45, uptime: '1d 2h', temperature: '45°C' },
];

// Tipos para os dados mockados
type DeviceStatus = 'online' | 'offline' | 'warning' | 'maintenance';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`inventory-tabpanel-${index}`}
      aria-labelledby={`inventory-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
    </div>
  );
}

export default function Inventory() {
  const [tabValue, setTabValue] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [openDialog, setOpenDialog] = useState(false);

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        mb: 3 
      }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 'bold', color: 'text.primary' }}>
            📦 Inventário de Dispositivos
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Gestão completa de CPEs, ONUs e OLTs da rede
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            variant="outlined"
            startIcon={<Download />}
            sx={{ borderRadius: 2 }}
          >
            Exportar
          </Button>
          <Button
            variant="contained"
            startIcon={<Add />}
            sx={{ borderRadius: 2 }}
            onClick={() => setOpenDialog(true)}
          >
            Adicionar
          </Button>
        </Box>
      </Box>

      {/* Metrics Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            title="CPEs"
            value={mockDevices.cpes}
            subtitle="Customer Premise Equipment"
            color="primary"
            icon={Devices}
          />
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            title="ONUs"
            value={mockDevices.onus}
            subtitle="Optical Network Units"
            color="secondary"
            icon={Router}
          />
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            title="OLTs"
            value={mockDevices.olts}
            subtitle="Optical Line Terminals"
            color="success"
            icon={Storage}
          />
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            title="Total"
            value={mockDevices.total}
            subtitle="Dispositivos gerenciados"
            color="warning"
            icon={DeviceHub}
          />
        </Grid>
      </Grid>

      {/* Filtros e Busca */}
      <BerryCard gradient={false}>
        <CardContent>
          <Box sx={{ display: 'flex', gap: 2, mb: 2, flexWrap: 'wrap' }}>
            <TextField
              placeholder="Buscar dispositivos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search color="action" />
                  </InputAdornment>
                ),
              }}
              sx={{ minWidth: 300, flex: 1 }}
            />
            <FormControl sx={{ minWidth: 150 }}>
              <InputLabel>Status</InputLabel>
              <Select
                value={filterStatus}
                label="Status"
                onChange={(e) => setFilterStatus(e.target.value)}
              >
                <MenuItem value="all">Todos</MenuItem>
                <MenuItem value="online">Online</MenuItem>
                <MenuItem value="offline">Offline</MenuItem>
                <MenuItem value="warning">Atenção</MenuItem>
                <MenuItem value="maintenance">Manutenção</MenuItem>
              </Select>
            </FormControl>
            <Button
              variant="outlined"
              startIcon={<FilterList />}
              sx={{ borderRadius: 2 }}
            >
              Filtros
            </Button>
            <Button
              variant="outlined"
              startIcon={<Refresh />}
              sx={{ borderRadius: 2 }}
            >
              Atualizar
            </Button>
          </Box>
        </CardContent>
      </BerryCard>

      {/* Tabs para diferentes tipos de dispositivos */}
      <Box sx={{ mt: 3 }}>
        <BerryCard gradient={false}>
          <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
            <Tabs value={tabValue} onChange={handleTabChange} aria-label="inventory tabs">
              <Tab 
                label={`CPEs (${mockDevices.cpes})`} 
                icon={<Devices />} 
                iconPosition="start"
              />
              <Tab 
                label={`ONUs (${mockDevices.onus})`} 
                icon={<Router />} 
                iconPosition="start"
              />
              <Tab 
                label={`OLTs (${mockDevices.olts})`} 
                icon={<Storage />} 
                iconPosition="start"
              />
            </Tabs>
          </Box>

          {/* Tab Panel CPEs */}
          <TabPanel value={tabValue} index={0}>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell><strong>ID</strong></TableCell>
                    <TableCell><strong>Modelo</strong></TableCell>
                    <TableCell><strong>Cliente</strong></TableCell>
                    <TableCell><strong>Localização</strong></TableCell>
                    <TableCell><strong>Status</strong></TableCell>
                    <TableCell><strong>Sinal (dBm)</strong></TableCell>
                    <TableCell><strong>Último Visto</strong></TableCell>
                    <TableCell><strong>Firmware</strong></TableCell>
                    <TableCell><strong>Ações</strong></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {mockCPEs.filter(cpe => 
                    filterStatus === 'all' || cpe.status === filterStatus
                  ).filter(cpe => 
                    searchTerm === '' || 
                    cpe.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    cpe.customer.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    cpe.model.toLowerCase().includes(searchTerm.toLowerCase())
                  ).map((cpe) => (
                    <TableRow key={cpe.id} hover>
                      <TableCell>
                        <Typography variant="body2" fontWeight={600} color="primary.main">
                          {cpe.id}
                        </Typography>
                      </TableCell>
                      <TableCell>{cpe.model}</TableCell>
                      <TableCell>{cpe.customer}</TableCell>
                      <TableCell>{cpe.location}</TableCell>
                      <TableCell><StatusChip status={cpe.status as DeviceStatus} /></TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <SignalWifi4Bar 
                            fontSize="small" 
                            color={cpe.signal > -50 ? 'success' : 'warning'}
                          />
                          <Typography 
                            variant="body2" 
                            color={cpe.signal > -50 ? 'success.main' : 'warning.main'}
                            fontWeight={600}
                          >
                            {cpe.signal}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" color="text.secondary">
                          {cpe.lastSeen}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip 
                          label={cpe.firmware} 
                          size="small" 
                          variant="outlined"
                          color={cpe.firmware.startsWith('1.2') ? 'success' : 'warning'}
                        />
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', gap: 1 }}>
                          <IconButton size="small" color="primary">
                            <Visibility fontSize="small" />
                          </IconButton>
                          <IconButton size="small" color="secondary">
                            <Edit fontSize="small" />
                          </IconButton>
                          <IconButton size="small" color="error">
                            <Delete fontSize="small" />
                          </IconButton>
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </TabPanel>

          {/* Tab Panel ONUs */}
          <TabPanel value={tabValue} index={1}>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell><strong>ID</strong></TableCell>
                    <TableCell><strong>Modelo</strong></TableCell>
                    <TableCell><strong>Cliente</strong></TableCell>
                    <TableCell><strong>Localização</strong></TableCell>
                    <TableCell><strong>Status</strong></TableCell>
                    <TableCell><strong>Sinal (dBm)</strong></TableCell>
                    <TableCell><strong>Portas</strong></TableCell>
                    <TableCell><strong>Uptime</strong></TableCell>
                    <TableCell><strong>Ações</strong></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {mockONUs.filter(onu => 
                    filterStatus === 'all' || onu.status === filterStatus
                  ).filter(onu => 
                    searchTerm === '' || 
                    onu.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    onu.customer.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    onu.model.toLowerCase().includes(searchTerm.toLowerCase())
                  ).map((onu) => (
                    <TableRow key={onu.id} hover>
                      <TableCell>
                        <Typography variant="body2" fontWeight={600} color="secondary.main">
                          {onu.id}
                        </Typography>
                      </TableCell>
                      <TableCell>{onu.model}</TableCell>
                      <TableCell>{onu.customer}</TableCell>
                      <TableCell>{onu.location}</TableCell>
                      <TableCell>{<StatusChip status={onu.status as DeviceStatus} />}</TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <NetworkCheck 
                            fontSize="small" 
                            color={onu.signal > -25 ? 'success' : 'warning'}
                          />
                          <Typography 
                            variant="body2" 
                            color={onu.signal > -25 ? 'success.main' : 'warning.main'}
                            fontWeight={600}
                          >
                            {onu.signal}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {onu.ports}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" color="text.secondary">
                          {onu.uptime}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', gap: 1 }}>
                          <IconButton size="small" color="primary">
                            <Visibility fontSize="small" />
                          </IconButton>
                          <IconButton size="small" color="secondary">
                            <Edit fontSize="small" />
                          </IconButton>
                          <IconButton size="small" color="error">
                            <Delete fontSize="small" />
                          </IconButton>
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </TabPanel>

          {/* Tab Panel OLTs */}
          <TabPanel value={tabValue} index={2}>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell><strong>ID</strong></TableCell>
                    <TableCell><strong>Modelo</strong></TableCell>
                    <TableCell><strong>Localização</strong></TableCell>
                    <TableCell><strong>Status</strong></TableCell>
                    <TableCell><strong>Portas</strong></TableCell>
                    <TableCell><strong>ONUs</strong></TableCell>
                    <TableCell><strong>Uptime</strong></TableCell>
                    <TableCell><strong>Temperatura</strong></TableCell>
                    <TableCell><strong>Ações</strong></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {mockOLTs.filter(olt => 
                    filterStatus === 'all' || olt.status === filterStatus
                  ).filter(olt => 
                    searchTerm === '' || 
                    olt.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    olt.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    olt.model.toLowerCase().includes(searchTerm.toLowerCase())
                  ).map((olt) => (
                    <TableRow key={olt.id} hover>
                      <TableCell>
                        <Typography variant="body2" fontWeight={600} color="success.main">
                          {olt.id}
                        </Typography>
                      </TableCell>
                      <TableCell>{olt.model}</TableCell>
                      <TableCell>{olt.location}</TableCell>
                      <TableCell>{<StatusChip status={olt.status as DeviceStatus} />}</TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <LinearProgress
                            variant="determinate"
                            value={(parseInt(olt.ports.split('/')[0]) / parseInt(olt.ports.split('/')[1])) * 100}
                            sx={{ width: 60, height: 6, borderRadius: 3 }}
                          />
                          <Typography variant="body2">
                            {olt.ports}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Chip 
                          label={olt.onus} 
                          size="small" 
                          color="primary" 
                          variant="outlined"
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" color="text.secondary">
                          {olt.uptime}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography 
                          variant="body2" 
                          color={parseInt(olt.temperature) > 40 ? 'warning.main' : 'success.main'}
                          fontWeight={600}
                        >
                          {olt.temperature}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', gap: 1 }}>
                          <IconButton size="small" color="primary">
                            <Visibility fontSize="small" />
                          </IconButton>
                          <IconButton size="small" color="secondary">
                            <Edit fontSize="small" />
                          </IconButton>
                          <IconButton size="small" color="error">
                            <Delete fontSize="small" />
                          </IconButton>
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </TabPanel>
        </BerryCard>
      </Box>

      {/* Dialog para adicionar dispositivo */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>Adicionar Novo Dispositivo</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="ID do Dispositivo"
                  placeholder="Ex: CPE001"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Tipo</InputLabel>
                  <Select label="Tipo">
                    <MenuItem value="cpe">CPE</MenuItem>
                    <MenuItem value="onu">ONU</MenuItem>
                    <MenuItem value="olt">OLT</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Modelo"
                  placeholder="Ex: Intelbras IWR 3000N"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Cliente/Localização"
                  placeholder="Ex: João Silva"
                />
              </Grid>
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Cancelar</Button>
          <Button variant="contained" onClick={() => setOpenDialog(false)}>
            Adicionar
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
