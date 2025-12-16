import { Card, CardProps, styled } from '@mui/material';
import { FC, ReactNode, useState, useEffect } from 'react';

interface AnimatedCardProps extends CardProps {
  children: ReactNode;
  delay?: number;
  duration?: number;
  disableHoverEffect?: boolean;
}

const StyledCard = styled(Card, {
  shouldForwardProp: (prop) =>
    !['isVisible', 'delay', 'duration', 'disableHoverEffect'].includes(
      prop as string
    ),
})<{
  isVisible: boolean;
  delay: number;
  duration: number;
  disableHoverEffect?: boolean;
}>(({ theme: _theme, isVisible, delay, duration, disableHoverEffect }) => ({
  backgroundColor: 'rgb(255, 255, 255)',
  color: 'rgb(17, 24, 39)',
  boxShadow:
    '0px 2px 1px -1px rgba(107, 114, 128, 0.03), 0px 1px 1px 0px rgba(107, 114, 128, 0.04), 0px 1px 3px 0px rgba(107, 114, 128, 0.08)',
  backgroundImage: 'none',
  overflow: 'hidden',
  borderRadius: '12px',
  border: 'none',

  // Animações de entrada
  opacity: isVisible ? 1 : 0,
  transform: isVisible ? 'translateY(0px)' : 'translateY(24px)',
  transition: `
      opacity ${duration}ms cubic-bezier(0.4, 0, 0.2, 1) ${delay}ms,
      transform ${duration}ms cubic-bezier(0.4, 0, 0.2, 1) ${delay}ms,
      all 300ms ease
    `,

  // Hover effect
  ...(disableHoverEffect
    ? {
        '&:hover': {
          transform: 'none !important',
          transition: 'none !important',
        },
      }
    : {
        '&:hover': {
          transform: isVisible ? 'translateY(-4px)' : 'translateY(24px)',
          boxShadow:
            '0px 4px 8px -2px rgba(107, 114, 128, 0.08), 0px 2px 4px -1px rgba(107, 114, 128, 0.06), 0px 1px 6px 0px rgba(107, 114, 128, 0.12)',
        },
      }),
}));

const AnimatedCard: FC<AnimatedCardProps> = ({
  children,
  delay = 0,
  duration = 600,
  disableHoverEffect = false,
  sx,
  ...props
}) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Trigger animation after component mounts
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 50); // Small delay to ensure mount

    return () => clearTimeout(timer);
  }, []);

  return (
    <StyledCard
      isVisible={isVisible}
      delay={delay}
      duration={duration}
      disableHoverEffect={disableHoverEffect}
      sx={sx}
      {...props}
    >
      {children}
    </StyledCard>
  );
};

export default AnimatedCard;
