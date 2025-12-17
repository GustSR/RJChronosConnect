import { AddNewUserPage } from '@features/user-management';
import { useTitle } from '@shared/lib/hooks';
import type { FC } from 'react';

const AddNewUser: FC = () => {
  useTitle('Add New User');
  return <AddNewUserPage />;
};

export default AddNewUser;

