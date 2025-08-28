import * as React from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  LinearProgress,
  Chip,
} from '@mui/material';
import { TrendingUp, TrendingDown, Minus, Activity, Zap, Wifi, Users } from 'lucide-react';

interface Trend {
  direction: 'up' | 'down' | 'stable';
  value: string;
}

interface EnhancedMetricCardProps {
  title: string;
  value: string | number;
  icon?: React.ReactNode;
  trend?: Trend;
  subtitle?: string;
  progress?: number;
  status?: 'healthy' | 'warning' | 'error' | 'info';
  onClick?: () => void;
  className?: string;
}

const EnhancedMetricCard: React.FC<EnhancedMetricCardProps> = ({
  title,
  value,
  icon,
  trend,
  subtitle,
  progress,
  status = 'healthy',
  onClick,
  className = '',
}) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy':
        return '#22c55e';
      case 'warning':
        return '#f59e0b';
      case 'error':
        return '#ef4444';
      case 'info':
        return '#3b82f6';
      default:
        return '#64748b';
    }
  };

  const getTrendIcon = (direction: string) => {
    switch (direction) {
      case 'up':
        return <TrendingUp size={14} color="#22c55e" />;
      case 'down':
        return <TrendingDown size={14} color="#ef4444" />;
      case 'stable':
        return <Minus size={14} color="#64748b" />;
      default:
        return null;
    }
  };

  const getTrendColor = (direction: string) => {
    switch (direction) {
      case 'up':
        return '#22c55e';
      case 'down':
        return '#ef4444';
      case 'stable':
        return '#64748b';
      default:
        return '#64748b';
    }
  };

  return (
    <Card
      className={`bg-dark-card border-gray-700 hover:border-gray-600 transition-colors cursor-pointer ${className}`}
      onClick={onClick}
      sx={{
        background: 'rgba(30, 41, 59, 0.8)',
        backdropFilter: 'blur(10px)',
        border: '1px solid rgba(71, 85, 105, 0.4)',
        '&:hover': {
          border: '1px solid rgba(71, 85, 105, 0.6)',
        },
      }}
    >
      <CardContent sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {icon && (
              <Box sx={{ color: getStatusColor(status), display: 'flex', alignItems: 'center' }}>
                {icon}
              </Box>
            )}
            <Typography variant="body2" sx={{ color: '#94a3b8', fontWeight: 500 }}>
              {title}
            </Typography>
          </Box>
          
          {trend && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              {getTrendIcon(trend.direction)}
              <Typography
                variant="caption"
                sx={{
                  color: getTrendColor(trend.direction),
                  fontWeight: 600,
                  fontSize: '0.75rem',
                }}
              >
                {trend.value}
              </Typography>
            </Box>
          )}
        </Box>

        <Typography
          variant="h4"
          sx={{
            color: 'white',
            fontWeight: 700,
            mb: subtitle ? 1 : 2,
            fontSize: '2rem',
          }}
        >
          {value}
        </Typography>

        {subtitle && (
          <Typography variant="body2" sx={{ color: '#64748b', mb: 2 }}>
            {subtitle}
          </Typography>
        )}

        {progress !== undefined && (
          <Box sx={{ mb: 1 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
              <Typography variant="caption" sx={{ color: '#94a3b8' }}>
                Utilização
              </Typography>
              <Typography variant="caption" sx={{ color: getStatusColor(status) }}>
                {progress}%
              </Typography>
            </Box>
            <LinearProgress
              variant="determinate"
              value={progress}
              sx={{
                height: 6,
                borderRadius: 3,
                backgroundColor: 'rgba(71, 85, 105, 0.3)',
                '& .MuiLinearProgress-bar': {
                  backgroundColor: getStatusColor(status),
                  borderRadius: 3,
                },
              }}
            />
          </Box>
        )}

        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Chip
            label={status.toUpperCase()}
            size="small"
            sx={{
              backgroundColor: `${getStatusColor(status)}20`,
              color: getStatusColor(status),
              fontSize: '0.7rem',
              fontWeight: 600,
              height: 20,
              border: `1px solid ${getStatusColor(status)}40`,
            }}
          />
          
          {onClick && (
            <Typography variant="caption" sx={{ color: '#64748b' }}>
              Clique para detalhes
            </Typography>
          )}
        </Box>
      </CardContent>
    </Card>
  );
};

// Componentes pré-configurados para métricas comuns
export const DevicesMetricCard: React.FC = () => (
  <EnhancedMetricCard
    title="Dispositivos Ativos"
    value="1,247"
    icon={<Activity size={20} />}
    trend={{ direction: 'up', value: '+5.2%' }}
    subtitle="Últimas 24h"
    progress={85}
    status="healthy"
  />
);

export const BandwidthMetricCard: React.FC = () => (
  <EnhancedMetricCard
    title="Largura de Banda"
    value="892 Mbps"
    icon={<Zap size={20} />}
    trend={{ direction: 'down', value: '-2.1%' }}
    subtitle="Pico atual"
    progress={67}
    status="warning"
  />
);

export const ConnectionsMetricCard: React.FC = () => (
  <EnhancedMetricCard
    title="Conexões WiFi"
    value="3,456"
    icon={<Wifi size={20} />}
    trend={{ direction: 'up', value: '+12.3%' }}
    subtitle="Conexões ativas"
    progress={92}
    status="healthy"
  />
);

export const UsersMetricCard: React.FC = () => (
  <EnhancedMetricCard
    title="Usuários Online"
    value="2,891"
    icon={<Users size={20} />}
    trend={{ direction: 'stable', value: '0.0%' }}
    subtitle="Últimos 5 min"
    progress={73}
    status="info"
  />
);

export default EnhancedMetricCard;