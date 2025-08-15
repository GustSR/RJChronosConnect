import React from 'react';
import { Card, CardContent, Typography, Box, useTheme, alpha } from '@mui/material';
import { SvgIconComponent } from '@mui/icons-material';

interface BerryMetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: SvgIconComponent;
  variant?: 'primary' | 'secondary' | 'success' | 'warning' | 'info' | 'error';
  trend?: {
    value: number;
    isPositive: boolean;
  };
}

export default function BerryMetricCard({
  title,
  value,
  subtitle,
  icon: Icon,
  variant = 'primary',
  trend,
}: BerryMetricCardProps) {
  const theme = useTheme();

  const getGradientColors = () => {
    switch (variant) {
      case 'primary':
        return `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`;
      case 'secondary':
        return `linear-gradient(135deg, ${theme.palette.secondary.main} 0%, ${theme.palette.primary.main} 100%)`;
      case 'success':
        return `linear-gradient(135deg, ${theme.palette.success.main} 0%, #4caf50 100%)`;
      case 'warning':
        return `linear-gradient(135deg, ${theme.palette.warning.main} 0%, #ff9800 100%)`;
      case 'info':
        return `linear-gradient(135deg, ${theme.palette.info.main} 0%, #2196f3 100%)`;
      case 'error':
        return `linear-gradient(135deg, ${theme.palette.error.main} 0%, #f44336 100%)`;
      default:
        return `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`;
    }
  };

  const getBackgroundGradient = () => {
    switch (variant) {
      case 'primary':
        return `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`;
      case 'secondary':
        return `linear-gradient(135deg, ${theme.palette.secondary.main} 0%, ${theme.palette.primary.main} 100%)`;
      case 'success':
        return `linear-gradient(135deg, #4ade80 0%, #22c55e 100%)`;
      case 'warning':
        return `linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)`;
      case 'info':
        return `linear-gradient(135deg, #60a5fa 0%, #3b82f6 100%)`;
      case 'error':
        return `linear-gradient(135deg, #f87171 0%, #ef4444 100%)`;
      default:
        return `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`;
    }
  };

  return (
    <Card
      sx={{
        background: getBackgroundGradient(),
        border: 'none',
        borderRadius: 3,
        boxShadow: '0 2px 8px 0 rgba(0, 0, 0, 0.08)',
        transition: 'all 0.3s ease-in-out',
        color: 'white',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: '0 8px 25px 0 rgba(0, 0, 0, 0.15)',
        },
      }}
    >
      <CardContent sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
          <Box sx={{ flex: 1 }}>
            <Typography
              variant="body2"
              sx={{ fontWeight: 500, mb: 1, color: 'rgba(255, 255, 255, 0.9)' }}
            >
              {title}
            </Typography>
            
            <Typography
              variant="h3"
              sx={{
                fontWeight: 700,
                color: 'white',
                mb: 0.5,
              }}
            >
              {value}
            </Typography>

            {subtitle && (
              <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.8)' }}>
                {subtitle}
              </Typography>
            )}

            {trend && (
              <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                <Typography
                  variant="body2"
                  sx={{
                    color: trend.isPositive ? 'rgba(255, 255, 255, 0.95)' : 'rgba(255, 255, 255, 0.95)',
                    fontWeight: 600,
                  }}
                >
                  {trend.isPositive ? '+' : ''}{trend.value}%
                </Typography>
                <Typography variant="body2" sx={{ ml: 0.5, color: 'rgba(255, 255, 255, 0.8)' }}>
                  vs último período
                </Typography>
              </Box>
            )}
          </Box>

          <Box
            sx={{
              width: 56,
              height: 56,
              borderRadius: 2,
              background: getGradientColors(),
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: `0 4px 15px 0 ${alpha(theme.palette.primary.main, 0.3)}`,
            }}
          >
            <Icon sx={{ color: 'white', fontSize: 28 }} />
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
}
