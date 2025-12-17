import type { ReactNode } from 'react';
import type { CardProps } from '@mui/material';
import { CardContent, Typography } from '@mui/material';
import AnimatedCard from './AnimatedCard';

type Props = Omit<CardProps, 'children'> & {
  delay?: number;
  icon: ReactNode;
  value: ReactNode;
  label: ReactNode;
  disableHoverEffect?: boolean;
};

export function KpiCard({ delay = 0, icon, value, label, disableHoverEffect = true, sx, ...props }: Props) {
  return (
    <AnimatedCard delay={delay} disableHoverEffect={disableHoverEffect} sx={[{ height: '100%', boxShadow: 'none !important' }, sx]} {...props}>
      <CardContent sx={{ textAlign: 'center' }}>
        {icon}
        <Typography variant="h4" sx={{ fontWeight: 600 }}>
          {value}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {label}
        </Typography>
      </CardContent>
    </AnimatedCard>
  );
}

