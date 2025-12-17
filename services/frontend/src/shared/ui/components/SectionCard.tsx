import { Card, CardContent, Typography } from '@mui/material';
import type { CardProps } from '@mui/material';
import type { ReactNode } from 'react';

type Props = CardProps & {
  title: ReactNode;
  children: ReactNode;
};

const defaultCardSx = {
  borderRadius: 2,
  border: '1px solid #e0e0e0',
  boxShadow: 'none',
  transition: 'none !important',
  '&:hover': { boxShadow: 'none !important', transform: 'none !important' },
};

export function SectionCard({ title, children, sx, ...props }: Props) {
  return (
    <Card {...props} sx={[defaultCardSx, sx]}>
      <CardContent sx={{ p: 3 }}>
        <Typography variant="h6" fontWeight="600" sx={{ mb: 2, color: 'primary.main' }}>
          {title}
        </Typography>
        {children}
      </CardContent>
    </Card>
  );
}

