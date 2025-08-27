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
} from '@mui/material';
import {
  AccountTree,
  Router,
  Devices,
  Wifi,
  Hub,
  ZoomIn,
  ZoomOut,
  Refresh,
  Fullscreen,
  Settings,
  Visibility,
  Edit,
  Add,
  FilterList,
  Search,
  Download,
  Print,
  Share,
} from '@mui/icons-material';

// Mock topology data
const topologyNodes = [
  { id: 'olt-001', type: 'olt', name: 'OLT Central', x: 400, y: 100, status: 'online', connections: 24 },
  { id: 'olt-002', type: 'olt', name: 'OLT Norte', x: 200, y: 100, status: 'online', connections: 18 },
  { id: 'olt-003', type: 'olt', name: 'OLT Sul', x: 600, y: 100, status: 'warning', connections: 30 },
  { id: 'switch-001', type: 'switch', name: 'Switch Core', x: 400, y: 250, status: 'online', connections: 48 },
  { id: 'router-001', type: 'router', name: 'Router Principal', x: 400, y: 400, status: 'online', connections: 8 },
  { id: 'cpe-001', type: 'cpe', name: 'CPE Cliente 001', x: 150, y: 350, status: 'online', connections: 1 },
  { id: 'cpe-002', type: 'cpe', name: 'CPE Cliente 002', x: 300, y: 350, status: 'online', connections: 1 },
  { id: 'cpe-003', type: 'cpe', name: 'CPE Cliente 003', x: 500, y: 350, status: 'warning', connections: 1 },
  { id: 'cpe-004', type: 'cpe', name: 'CPE Cliente 004', x: 650, y: 350, status: 'offline', connections: 1 },
];

const topologyConnections = [
  { from: 'olt-001', to: 'switch-001', type: 'fiber', status: 'active' },
  { from: 'olt-002', to: 'switch-001', type: 'fiber', status: 'active' },
  { from: 'olt-003', to: 'switch-001', type: 'fiber', status: 'warning' },
  { from: 'switch-001', to: 'router-001', type: 'ethernet', status: 'active' },
  { from: 'olt-001', to: 'cpe-001', type: 'fiber', status: 'active' },
  { from: 'olt-001', to: 'cpe-002', type: 'fiber', status: 'active' },
  { from: 'olt-003', to: 'cpe-003', type: 'fiber', status: 'warning' },
  { from: 'olt-003', to: 'cpe-004', type: 'fiber', status: 'inactive' },
];

const topologyStats = {
  totalNodes: topologyNodes.length,
  activeConnections: topologyConnections.filter(c => c.status === 'active').length,
  warningNodes: topologyNodes.filter(n => n.status === 'warning').length,
  offlineNodes: topologyNodes.filter(n => n.status === 'offline').length,
};

interface MetricCardProps {
  title: string;
  value: number;
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

function getNodeIcon(type: string) {
  switch (type) {
    case 'olt': return <Hub />;
    case 'switch': return <Router />;
    case 'router': return <Router />;
    case 'cpe': return <Devices />;
    default: return <Wifi />;
  }
}

function getStatusColor(status: string) {
  switch (status) {
    case 'online': return 'success';
    case 'warning': return 'warning';
    case 'offline': return 'error';
    default: return 'default';
  }
}

export default function Topology() {
  const [tabValue, setTabValue] = useState(0);
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState('logical');
  const [zoomLevel, setZoomLevel] = useState(100);
  const theme = useTheme();

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleZoomIn = () => {
    setZoomLevel(prev => Math.min(prev + 25, 200));
  };

  const handleZoomOut = () => {
    setZoomLevel(prev => Math.max(prev - 25, 50));
  };

  return (
    <Box>
      {/* Header */}
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <Box>
          <Typography variant="h4" fontWeight={700} gutterBottom>
            🌐 Topologia da Rede
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Visualização interativa da infraestrutura de rede
          </Typography>
        </Box>
        
        <Box sx={{ display: 'flex', gap: 2 }}>
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>Visualização</InputLabel>
            <Select
              value={viewMode}
              label="Visualização"
              onChange={(e) => setViewMode(e.target.value)}
            >
              <MenuItem value="logical">Lógica</MenuItem>
              <MenuItem value="physical">Física</MenuItem>
              <MenuItem value="geographic">Geográfica</MenuItem>
            </Select>
          </FormControl>
          
          <Button variant="outlined" startIcon={<Refresh />}>
            Atualizar
          </Button>
          
          <Button variant="contained" startIcon={<Add />}>
            Adicionar Nó
          </Button>
        </Box>
      </Box>

      {/* Metrics Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            title="Total de Nós"
            value={topologyStats.totalNodes}
            subtitle="Dispositivos na topologia"
            color="primary"
            icon={AccountTree}
          />
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            title="Conexões Ativas"
            value={topologyStats.activeConnections}
            subtitle="Links funcionais"
            color="success"
            icon={Hub}
          />
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            title="Alertas"
            value={topologyStats.warningNodes}
            subtitle="Nós com problemas"
            color="warning"
            icon={Router}
          />
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            title="Offline"
            value={topologyStats.offlineNodes}
            subtitle="Dispositivos inativos"
            color="error"
            icon={Devices}
          />
        </Grid>
      </Grid>

      {/* Main Topology View */}
      <Card>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 2 }}>
            <Tabs value={tabValue} onChange={handleTabChange}>
              <Tab label="🌐 Visão Geral" />
              <Tab label="📊 Detalhes" />
              <Tab label="⚙️ Configurações" />
            </Tabs>
            
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Tooltip title="Zoom In">
                <IconButton onClick={handleZoomIn} disabled={zoomLevel >= 200}>
                  <ZoomIn />
                </IconButton>
              </Tooltip>
              <Tooltip title="Zoom Out">
                <IconButton onClick={handleZoomOut} disabled={zoomLevel <= 50}>
                  <ZoomOut />
                </IconButton>
              </Tooltip>
              <Typography variant="body2" sx={{ alignSelf: 'center', mx: 1 }}>
                {zoomLevel}%
              </Typography>
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

        {/* Topology Canvas */}
        {tabValue === 0 && (
          <CardContent>
            <Paper
              sx={{
                height: 600,
                position: 'relative',
                overflow: 'hidden',
                backgroundColor: theme.palette.mode === 'dark' ? 'grey.900' : 'grey.50',
                border: `1px solid ${theme.palette.divider}`,
                borderRadius: 2,
              }}
            >
              {/* SVG Topology Visualization */}
              <svg
                width="100%"
                height="100%"
                style={{
                  transform: `scale(${zoomLevel / 100})`,
                  transformOrigin: 'center',
                }}
              >
                {/* Render connections */}
                {topologyConnections.map((connection, index) => {
                  const fromNode = topologyNodes.find(n => n.id === connection.from);
                  const toNode = topologyNodes.find(n => n.id === connection.to);
                  
                  if (!fromNode || !toNode) return null;
                  
                  return (
                    <line
                      key={index}
                      x1={fromNode.x}
                      y1={fromNode.y}
                      x2={toNode.x}
                      y2={toNode.y}
                      stroke={
                        connection.status === 'active' ? theme.palette.success.main :
                        connection.status === 'warning' ? theme.palette.warning.main :
                        theme.palette.error.main
                      }
                      strokeWidth={connection.status === 'active' ? 3 : 2}
                      strokeDasharray={connection.status === 'inactive' ? '5,5' : 'none'}
                    />
                  );
                })}
                
                {/* Render nodes */}
                {topologyNodes.map((node) => (
                  <g key={node.id}>
                    <circle
                      cx={node.x}
                      cy={node.y}
                      r={20}
                      fill={
                        node.status === 'online' ? theme.palette.success.main :
                        node.status === 'warning' ? theme.palette.warning.main :
                        theme.palette.error.main
                      }
                      stroke={theme.palette.background.paper}
                      strokeWidth={3}
                      style={{ cursor: 'pointer' }}
                      onClick={() => setSelectedNode(node.id)}
                    />
                    <text
                      x={node.x}
                      y={node.y + 35}
                      textAnchor="middle"
                      fontSize="12"
                      fill={theme.palette.text.primary}
                      style={{ cursor: 'pointer' }}
                      onClick={() => setSelectedNode(node.id)}
                    >
                      {node.name}
                    </text>
                  </g>
                ))}
              </svg>
              
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
                    <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: 'success.main' }} />
                    <Typography variant="caption">Online</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: 'warning.main' }} />
                    <Typography variant="caption">Atenção</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: 'error.main' }} />
                    <Typography variant="caption">Offline</Typography>
                  </Box>
                </Stack>
              </Box>
            </Paper>
          </CardContent>
        )}

        {/* Details Tab */}
        {tabValue === 1 && (
          <CardContent>
            <Typography variant="h6" fontWeight={600} gutterBottom>
              Detalhes dos Dispositivos
            </Typography>
            <Grid container spacing={2}>
              {topologyNodes.map((node) => (
                <Grid item xs={12} sm={6} md={4} key={node.id}>
                  <Card variant="outlined">
                    <CardContent>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                        <Avatar sx={{ bgcolor: `${getStatusColor(node.status)}.main` }}>
                          {getNodeIcon(node.type)}
                        </Avatar>
                        <Box>
                          <Typography variant="subtitle1" fontWeight={600}>
                            {node.name}
                          </Typography>
                          <Chip
                            label={node.status}
                            color={getStatusColor(node.status) as any}
                            size="small"
                          />
                        </Box>
                      </Box>
                      <Typography variant="body2" color="text.secondary">
                        Tipo: {node.type.toUpperCase()}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Conexões: {node.connections}
                      </Typography>
                      <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
                        <IconButton size="small" color="primary">
                          <Visibility />
                        </IconButton>
                        <IconButton size="small" color="secondary">
                          <Edit />
                        </IconButton>
                        <IconButton size="small">
                          <Settings />
                        </IconButton>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </CardContent>
        )}

        {/* Settings Tab */}
        {tabValue === 2 && (
          <CardContent>
            <Typography variant="h6" fontWeight={600} gutterBottom>
              Configurações da Topologia
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Configurações avançadas de visualização e layout da topologia serão implementadas aqui.
            </Typography>
          </CardContent>
        )}
      </Card>
    </Box>
  );
}
