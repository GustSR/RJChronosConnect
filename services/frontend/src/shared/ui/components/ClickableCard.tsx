import type { CardProps } from '@mui/material';
import { alpha } from '@mui/material';
import { OutlinedCard } from './OutlinedCard';

type Props = CardProps & {
  hoverBorderColor?: string;
};

export function ClickableCard({ hoverBorderColor = 'primary.main', sx, ...props }: Props) {
  return (
    <OutlinedCard
      {...props}
      sx={[
        (theme) => ({
          cursor: 'pointer',
          '&:hover': {
            borderColor: hoverBorderColor,
            backgroundColor: alpha(theme.palette.primary.main, 0.04),
            boxShadow: 'none !important',
            transform: 'none !important',
          },
          '&:focus-visible': {
            outline: `2px solid ${alpha(theme.palette.primary.main, 0.4)}`,
            outlineOffset: 2,
          },
        }),
        sx,
      ]}
    />
  );
}
