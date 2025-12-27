import { ForgetPasswordPage } from '@features/authentication';
import { useTitle } from '@shared/lib/hooks';
import type { FC } from 'react';

const ForgetPassword: FC = () => {
  useTitle('Recuperar Senha');
  return <ForgetPasswordPage />;
};

export default ForgetPassword;

