import React from 'react';
import { Card, CardProps, useTheme } from '@mui/material';

interface BerryCardProps extends CardProps {
  gradient?: boolean;
  hover?: boolean;
}

const BerryCard: React.FC<BerryCardProps> = ({ 
  children, 
  gradient = true,
  hover = true,
  sx,
  ...props 
}) => {
  const theme = useTheme();
  
  return (
    <Card
      sx={{
        background: gradient 
          ? `linear-gradient(135deg, ${theme.palette.primary.main}15 0%, ${theme.palette.secondary.main}08 100%)`
          : 'background.paper',
        border: `1px solid ${theme.palette.divider}`,
        borderRadius: 2,
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        transition: 'all 0.3s ease',
        ...(hover && {
          '&:hover': {
            boxShadow: '0 4px 16px rgba(0,0,0,0.15)',
            transform: 'translateY(-2px)'
          }
        }),
        ...sx
      }}
      {...props}
    >
      {children}
    </Card>
  );
};

export default BerryCard;
