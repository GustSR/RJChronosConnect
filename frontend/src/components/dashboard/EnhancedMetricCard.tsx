import React from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  IconButton,
  Chip,
  LinearProgress,
  Tooltip
} from '@mui/material';
import {
  TrendingUp,
  TrendingDown,
  TrendingFlat,
  MoreVert,
  InfoOutlined
} from '@mui/icons-material';
import { formatPercentage, getStatusColor } from '@/utils';

interface EnhancedMetricCardProps {
  title: string;
  value: number | string;
  previousValue?: number;
  unit?: string;
  icon?: React.ReactNode;
  color?: string;
  trend?: 'up' | 'down' | 'flat';
  trendValue?: number;
  status?: 'healthy' | 'warning' | 'critical';
  target?: number;
  description?: string;
  showProgress?: boolean;
  onClick?: () => void;
  onMenuClick?: () => void;
  gradient?: boolean;
  size?: 'small' | 'medium' | 'large';
}

const EnhancedMetricCard: React.FC<EnhancedMetricCardProps> = ({
  title,
  value,
  previousValue,
  unit = '',
  icon,
  color = '#2196f3',
  trend,
  trendValue,
  status,
  target,
  description,
  showProgress = false,
  onClick,
  onMenuClick,
  gradient = true,
  size = 'medium'
}) => {
  const getTrendIcon = () => {
    switch (trend) {
      case 'up':
        return <TrendingUp sx={{ color: '#4caf50', fontSize: 20 }} />;
      case 'down':
        return <TrendingDown sx={{ color: '#f44336', fontSize: 20 }} />;
      case 'flat':
        return <TrendingFlat sx={{ color: '#ff9800', fontSize: 20 }} />;
      default:
        return null;
    }
  };

  const getTrendColor = () => {
    switch (trend) {
      case 'up':
        return '#4caf50';
      case 'down':
        return '#f44336';
      case 'flat':
        return '#ff9800';
      default:
        return '#666';
    }
  };

  const getStatusChip = () => {
    if (!status) return null;

    const statusConfig = {
      healthy: { label: 'Saudável', color: '#4caf50' },
      warning: { label: 'Atenção', color: '#ff9800' },
      critical: { label: 'Crítico', color: '#f44336' }
    };

    const config = statusConfig[status];
    return (
      <Chip
        size="small"
        label={config.label}
        sx={{
          backgroundColor: config.color,
          color: 'white',
          fontSize: '0.75rem',
          height: 20
        }}
      />
    );
  };

  const getProgressValue = () => {
    if (!target || typeof value !== 'number') return 0;
    return Math.min((value / target) * 100, 100);
  };

  const cardHeight = {
    small: 120,
    medium: 160,
    large: 200
  };

  const valueSize = {
    small: 'h5',
    medium: 'h4',
    large: 'h3'
  };

  return (
    <Card
      sx={{
        height: cardHeight[size],
        background: gradient
          ? `linear-gradient(135deg, ${color}15 0%, ${color}25 100%)`
          : 'background.paper',
        border: `1px solid ${color}30`,
        cursor: onClick ? 'pointer' : 'default',
        transition: 'all 0.3s ease',
        '&:hover': onClick ? {
          transform: 'translateY(-2px)',
          boxShadow: `0 8px 25px ${color}40`
        } : {},
        position: 'relative',
        overflow: 'hidden'
      }}
      onClick={onClick}
    >
      {/* Background decoration */}
      <Box
        sx={{
          position: 'absolute',
          top: -20,
          right: -20,
          width: 80,
          height: 80,
          borderRadius: '50%',
          background: `${color}20`,
          opacity: 0.3
        }}
      />

      <CardContent sx={{ height: '100%', display: 'flex', flexDirection: 'column', p: 2 }}>
        {/* Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flex: 1 }}>
            {icon && (
              <Box sx={{ color: color, display: 'flex', alignItems: 'center' }}>
                {icon}
              </Box>
            )}
            <Typography variant="subtitle2" color="text.secondary" sx={{ fontWeight: 500 }}>
              {title}
            </Typography>
            {description && (
              <Tooltip title={description} arrow>
                <InfoOutlined sx={{ fontSize: 16, color: 'text.disabled', cursor: 'help' }} />
              </Tooltip>
            )}
          </Box>
          
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {getStatusChip()}
            {onMenuClick && (
              <IconButton size="small" onClick={(e) => { e.stopPropagation(); onMenuClick(); }}>
                <MoreVert fontSize="small" />
              </IconButton>
            )}
          </Box>
        </Box>

        {/* Value */}
        <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <Typography
            variant={valueSize[size] as any}
            component="div"
            sx={{
              fontWeight: 'bold',
              color: color,
              mb: 0.5,
              display: 'flex',
              alignItems: 'baseline',
              gap: 0.5
            }}
          >
            {value}
            {unit && (
              <Typography variant="body2" component="span" color="text.secondary">
                {unit}
              </Typography>
            )}
          </Box>

          {/* Trend */}
          {trend && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 1 }}>
              {getTrendIcon()}
              <Typography
                variant="body2"
                sx={{ color: getTrendColor(), fontWeight: 500 }}
              >
                {trendValue !== undefined && (
                  <>
                    {trend === 'up' ? '+' : trend === 'down' ? '-' : ''}
                    {Math.abs(trendValue)}
                    {typeof trendValue === 'number' && trendValue < 1 ? '%' : ''}
                  </>
                )}
                {previousValue && typeof value === 'number' && (
                  <Typography variant="caption" color="text.secondary" sx={{ ml: 1 }}>
                    vs {previousValue}
                  </Typography>
                )}
              </Typography>
            </Box>
          )}

          {/* Progress */}
          {showProgress && target && typeof value === 'number' && (
            <Box sx={{ mt: 'auto' }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                <Typography variant="caption" color="text.secondary">
                  Progresso
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {formatPercentage(value, target)}
                </Typography>
              </Box>
              <LinearProgress
                variant="determinate"
                value={getProgressValue()}
                sx={{
                  height: 4,
                  borderRadius: 2,
                  backgroundColor: `${color}20`,
                  '& .MuiLinearProgress-bar': {
                    backgroundColor: color,
                    borderRadius: 2
                  }
                }}
              />
            </Box>
          )}
        </Box>
      </CardContent>
    </Card>
  );
};

export default EnhancedMetricCard;
