import { Card } from '@mui/material';
import type { CardProps } from '@mui/material';

const defaultSx = {
  borderRadius: 2,
  border: '1px solid #e0e0e0',
  boxShadow: 'none',
  transition: 'none !important',
  '&:hover': { boxShadow: 'none !important', transform: 'none !important' },
};

export function OutlinedCard({ sx, ...props }: CardProps) {
  const sxArray = Array.isArray(sx) ? sx : sx ? [sx] : [];
  return <Card {...props} sx={[defaultSx, ...sxArray]} />;
}
