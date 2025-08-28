import React from 'react';
import { Card, CardProps, useTheme, alpha } from '@mui/material';

interface BerryCardProps extends Omit<CardProps, 'variant'> {
  variant?: 'primary' | 'secondary' | 'success' | 'warning' | 'info';
  gradient?: boolean;
}

export default function BerryCard({ 
  children, 
  variant = 'primary', 
  gradient = true,
  sx,
  ...props 
}: BerryCardProps) {
  const theme = useTheme();

  const getGradientColors = () => {
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
      default:
        return `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`;
    }
  };

  const getBorderColor = () => {
    switch (variant) {
      case 'primary':
        return 'transparent';
      case 'secondary':
        return 'transparent';
      case 'success':
        return 'transparent';
      case 'warning':
        return 'transparent';
      case 'info':
        return 'transparent';
      default:
        return 'transparent';
    }
  };

  return (
    <Card
      {...props}
      sx={{
        background: gradient ? getGradientColors() : theme.palette.background.paper,
        border: 'none',
        borderRadius: 3,
        boxShadow: '0 2px 8px 0 rgba(0, 0, 0, 0.08)',
        transition: 'all 0.3s ease-in-out',
        color: gradient ? 'white' : 'inherit',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: '0 8px 25px 0 rgba(0, 0, 0, 0.15)',
        },
        ...sx,
      }}
    >
      {children}
    </Card>
  );
}