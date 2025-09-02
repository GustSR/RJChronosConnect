import { useState, useEffect } from 'react';

interface UsePageAnimationProps {
  delay?: number;
  duration?: number;
}

export const usePageAnimation = ({
  delay = 0,
  duration = 600,
}: UsePageAnimationProps = {}) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, delay + 50);

    return () => clearTimeout(timer);
  }, [delay]);

  const animationStyles = {
    opacity: isVisible ? 1 : 0,
    transform: isVisible ? 'translateY(0px)' : 'translateY(24px)',
    transition: `
      opacity ${duration}ms cubic-bezier(0.4, 0, 0.2, 1) ${delay}ms,
      transform ${duration}ms cubic-bezier(0.4, 0, 0.2, 1) ${delay}ms
    `,
  };

  return { isVisible, animationStyles };
};
