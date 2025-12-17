import { LoginPage } from '@features/authentication';
import { useTitle } from '@shared/lib/hooks';
import type { FC } from 'react';
import { useNavigate } from 'react-router-dom';

const Login: FC = () => {
  useTitle('Login - RJ Chronos');

  const navigate = useNavigate();
  return <LoginPage onSuccess={() => navigate('/dashboard')} />;
};

export default Login;

