import { useToast } from '@shared/lib/contexts/ToastContext';

export const useNotification = () => {
  const { showToast } = useToast();

  const showSuccess = (message: string) => {
    showToast(message, 'success');
  };

  const showError = (message: string) => {
    showToast(message, 'error');
  };

  const showWarning = (message: string) => {
    showToast(message, 'warning');
  };

  const showInfo = (message: string) => {
    showToast(message, 'info');
  };

  return {
    showSuccess,
    showError,
    showWarning,
    showInfo,
  };
};

export default useNotification;
