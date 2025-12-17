import { UserGridPage } from '@features/user-management';
import { useTitle } from '@shared/lib/hooks';
import type { FC } from 'react';
import { useNavigate } from 'react-router-dom';

const UserGrid: FC = () => {
  useTitle('User Grid');

  const navigate = useNavigate();
  return <UserGridPage onAddUser={() => navigate('/dashboard/add-user')} />;
};

export default UserGrid;

