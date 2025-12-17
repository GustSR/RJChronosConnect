import { UserProfilePage } from '@features/user-profile';
import { useAuth, useTitle } from '@shared/lib/hooks';
import type { FC } from 'react';

const UserProfile: FC = () => {
  useTitle('User Profile');
  const { user } = useAuth();
  return <UserProfilePage user={user} />;
};

export default UserProfile;
