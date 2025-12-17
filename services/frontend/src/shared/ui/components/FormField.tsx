import { Box, Typography } from '@mui/material';
import type { ReactNode } from 'react';

type Props = {
  label: ReactNode;
  children: ReactNode;
};

export function FormField({ label, children }: Props) {
  return (
    <Box>
      <Typography variant="body2" color="text.secondary" gutterBottom>
        {label}
      </Typography>
      {children}
    </Box>
  );
}

