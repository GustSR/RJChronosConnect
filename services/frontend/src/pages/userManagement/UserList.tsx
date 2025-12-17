import { UserListPage } from '@features/user-management';
import { useTitle } from '@shared/lib/hooks';
import type { FC } from 'react';
import { useNavigate } from 'react-router-dom';

const UserList: FC = () => {
  useTitle('User List');

  const navigate = useNavigate();
  return <UserListPage onAddUser={() => navigate('/dashboard/add-user')} />;
};

export default UserList;

