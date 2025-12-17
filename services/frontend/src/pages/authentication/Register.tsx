import { RegisterPage } from '@features/authentication';
import { useTitle } from '@shared/lib/hooks';
import type { FC } from 'react';
import { useNavigate } from 'react-router-dom';

const Register: FC = () => {
  useTitle('Register - RJ Chronos');

  const navigate = useNavigate();
  return <RegisterPage onSuccess={() => navigate('/dashboard')} />;
};

export default Register;

