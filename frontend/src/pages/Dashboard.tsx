import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  CardContent,
  Typography,
  IconButton,
  LinearProgress,
} from '@mui/material';
import {
  Devices,
  Warning,
  SignalWifi4Bar,
  CheckCircle,
  Refresh,
} from '@mui/icons-material';
import { BerryCard, MetricCard, PageHeader } from '../components/common';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar
} from 'recharts';

// Mock data seguindo o padrão Berry
const mockMetrics = {
  totalDevices: 1312,
  onlineDevices: 1247,
  criticalAlerts: 3,
  avgSignalStrength: -42.5,
  avgLatency: 15.2,
  slaCompliance: 99.7,
};

const mockChartData = [
  { time: '00:00', devices: 1120, alerts: 2, latency: 12, throughput: 85.2 },
  { time: '04:00', devices: 1115, alerts: 1, latency: 15, throughput: 82.1 },
  { time: '08:00', devices: 1235, alerts: 3, latency: 18, throughput: 78.5 },
  { time: '12:00', devices: 1247, alerts: 1, latency: 14, throughput: 89.3 },
  { time: '16:00', devices: 1198, alerts: 2, latency: 16, throughput: 87.1 },
  { time: '20:00', devices: 1156, alerts: 1, latency: 13, throughput: 91.4 },
];

const deviceTypes = [
  { name: 'CPEs', value: 856, color: '#2196f3' },
  { name: 'ONUs', value: 312, color: '#673ab7' },
  { name: 'OLTs', value: 89, color: '#4caf50' },
  { name: 'Switches', value: 55, color: '#ff9800' },
];

// Dados mockados para o dashboard seguindo padrão Berry

const Dashboard: React.FC = () => {
  const [lastUpdate, setLastUpdate] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => {
      setLastUpdate(new Date());
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const handleRefresh = () => {
    setLastUpdate(new Date());
  };

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <PageHeader
        title="🏠 Dashboard - Visão Geral"
        subtitle={`Monitoramento em tempo real da rede • Última atualização: ${lastUpdate.toLocaleTimeString()}`}
        breadcrumbs={[
          { label: 'Dashboard' }
        ]}
        status={{ label: 'Sistema Online', color: 'success' }}
        actions={
          <IconButton onClick={handleRefresh} sx={{ bgcolor: 'primary.main', color: 'white' }}>
            <Refresh />
          </IconButton>
        }
      />

      {/* Métricas Principais */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            title="Dispositivos Online"
            value={`${mockMetrics.onlineDevices}/${mockMetrics.totalDevices}`}
            icon={Devices}
            trend="up"
            trendValue="+2.5%"
            color="primary"
          />
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            title="Alertas Críticos"
            value={mockMetrics.criticalAlerts}
            icon={Warning}
            trend="down"
            trendValue="-12%"
            color="warning"
          />
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            title="Qualidade do Sinal"
            value={`${mockMetrics.avgSignalStrength} dBm`}
            icon={SignalWifi4Bar}
            trend="up"
            trendValue="+1.2 dBm"
            color="secondary"
          />
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            title="SLA Compliance"
            value={`${mockMetrics.slaCompliance}%`}
            icon={CheckCircle}
            trend="up"
            trendValue="+0.3%"
            color="success"
          />
        </Grid>
      </Grid>

      {/* Gráficos */}
      <Grid container spacing={3}>
        {/* Performance da Rede */}
        <Grid item xs={12} lg={8}>
          <BerryCard>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                📊 Performance da Rede - Últimas 24h
              </Typography>
              
              <Box sx={{ height: 300, mt: 2 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={mockChartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.1)" />
                    <XAxis dataKey="time" stroke="#64748b" />
                    <YAxis stroke="#64748b" />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: '#ffffff',
                        border: '1px solid #2196f3',
                        borderRadius: 8,
                        boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="devices"
                      stroke="#2196f3"
                      strokeWidth={3}
                      dot={{ fill: '#2196f3', strokeWidth: 2, r: 6 }}
                      name="Dispositivos Online"
                    />
                    <Line
                      type="monotone"
                      dataKey="latency"
                      stroke="#673ab7"
                      strokeWidth={2}
                      dot={{ fill: '#673ab7', strokeWidth: 2, r: 4 }}
                      name="Latência (ms)"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </Box>
            </CardContent>
          </BerryCard>
        </Grid>
        
        {/* Distribuição de Dispositivos */}
        <Grid item xs={12} lg={4}>
          <BerryCard>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                📱 Tipos de Dispositivos
              </Typography>
              <Box sx={{ height: 300 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={deviceTypes}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    >
                      {deviceTypes.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </Box>
            </CardContent>
          </BerryCard>
        </Grid>

        {/* Alertas por Hora */}
        <Grid item xs={12} md={6}>
          <BerryCard>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                🚨 Alertas por Hora
              </Typography>
              
              <Box sx={{ height: 250, mt: 2 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={mockChartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.1)" />
                    <XAxis dataKey="time" stroke="#64748b" />
                    <YAxis stroke="#64748b" />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: '#ffffff',
                        border: '1px solid #fbbf24',
                        borderRadius: 8,
                        boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                      }}
                    />
                    <Bar
                      dataKey="alerts"
                      fill="#fbbf24"
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </Box>
            </CardContent>
          </BerryCard>
        </Grid>

        {/* Status da Rede */}
        <Grid item xs={12} md={6}>
          <BerryCard>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                🌐 Status da Rede
              </Typography>
              
              <Grid container spacing={2} sx={{ mt: 1 }}>
                <Grid item xs={6}>
                  <Box sx={{ textAlign: 'center', p: 2, bgcolor: '#4caf5015', borderRadius: 2 }}>
                    <Typography variant="h5" sx={{ color: '#4caf50', fontWeight: 'bold' }}>
                      {mockMetrics.avgLatency}ms
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Latência Média
                    </Typography>
                  </Box>
                </Grid>
                
                <Grid item xs={6}>
                  <Box sx={{ textAlign: 'center', p: 2, bgcolor: '#2196f315', borderRadius: 2 }}>
                    <Typography variant="h5" sx={{ color: '#2196f3', fontWeight: 'bold' }}>
                      85.2 Mbps
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Throughput Médio
                    </Typography>
                  </Box>
                </Grid>
                
                <Grid item xs={12}>
                  <Box sx={{ mt: 2 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="body2">Uptime da Rede</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 'bold' }}>99.95%</Typography>
                    </Box>
                    <LinearProgress 
                      variant="determinate" 
                      value={99.95} 
                      sx={{ 
                        height: 8, 
                        borderRadius: 4,
                        backgroundColor: '#e0e0e0',
                        '& .MuiLinearProgress-bar': {
                          backgroundColor: '#4caf50',
                          borderRadius: 4
                        }
                      }} 
                    />
                  </Box>
                </Grid>
              </Grid>
            </CardContent>
          </BerryCard>
        </Grid>

        <Grid item xs={12} md={6}>
          <BerryCard>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                📊 OLTs Operacionais
              </Typography>
              <Box sx={{ mb: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2" color="text.primary">OLTs Operacionais</Typography>
                  <Typography variant="body2" fontWeight={600} color="text.primary">100%</Typography>
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={100}
                  sx={{ 
                    height: 8, 
                    borderRadius: 4,
                    backgroundColor: 'rgba(0,0,0,0.08)',
                    '& .MuiLinearProgress-bar': {
                      background: `linear-gradient(90deg, #4ade80 0%, #22c55e 100%)`,
                    }
                  }}
                />
              </Box>
              <Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2" color="text.primary">Qualidade do Sinal</Typography>
                  <Typography variant="body2" fontWeight={600} color="text.primary">92%</Typography>
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={92}
                  sx={{ 
                    height: 8, 
                    borderRadius: 4,
                    backgroundColor: 'rgba(0,0,0,0.08)',
                    '& .MuiLinearProgress-bar': {
                      background: `linear-gradient(90deg, #60a5fa 0%, #3b82f6 100%)`,
                    }
                  }}
                />
              </Box>
            </CardContent>
          </BerryCard>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Dashboard;
