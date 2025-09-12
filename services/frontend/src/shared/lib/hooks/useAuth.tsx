import AuthContext from '@shared/lib/contexts/JWTAuthContext';
import { useContext } from 'react';

const useAuth = () => useContext(AuthContext);

export default useAuth;
