import { LoadingScreen } from '@shared/ui/components';
import { createContext, ReactNode, useEffect, useReducer } from 'react';
import { axios } from '@shared/lib/utils';
import { devConfig } from '@shared/api/api';

// All types
// =============================================
export type ActionMap<M extends { [index: string]: unknown }> = {
  [Key in keyof M]: M[Key] extends undefined
    ? {
        type: Key;
      }
    : {
        type: Key;
        payload: M[Key];
      };
};

export type AuthUser = null | Record<string, unknown>;

export type AuthState = {
  isAuthenticated: boolean;
  isInitialized: boolean;
  user: AuthUser;
};

enum Types {
  Init = 'INIT',
  Login = 'LOGIN',
  Logout = 'LOGOUT',
  Register = 'REGISTER',
}

type JWTAuthPayload = {
  [Types.Init]: {
    isAuthenticated: boolean;
    user: AuthUser;
  };
  [Types.Logout]: undefined;
  [Types.Login]: { user: AuthUser };
  [Types.Register]: { user: AuthUser };
};

type JWTActions = ActionMap<JWTAuthPayload>[keyof ActionMap<JWTAuthPayload>];
// ================================================

const initialState: AuthState = {
  isAuthenticated: false,
  isInitialized: false,
  user: null,
};

const isValidToken = (accessToken: string) => {
  if (!accessToken) return false;

  // Simplified validation - just check if token exists
  // In production, you should implement proper JWT validation
  return true;
};

const setSession = (accessToken: string | null) => {
  if (accessToken) {
    localStorage.setItem('accessToken', accessToken);
    axios.defaults.headers.common.Authorization = `Bearer ${accessToken}`;
  } else {
    localStorage.removeItem('accessToken');
    delete axios.defaults.headers.common.Authorization;
  }
};

const reducer = (state: AuthState, action: JWTActions) => {
  switch (action.type) {
    case 'INIT': {
      return {
        isInitialized: true,
        user: action.payload.user,
        isAuthenticated: action.payload.isAuthenticated,
      };
    }
    case 'LOGIN': {
      return {
        ...state,
        isAuthenticated: true,
        user: action.payload.user,
      };
    }
    case 'LOGOUT': {
      return {
        ...state,
        user: null,
        isAuthenticated: false,
      };
    }
    case 'REGISTER': {
      return {
        ...state,
        isAuthenticated: true,
        user: action.payload.user,
      };
    }

    default: {
      return state;
    }
  }
};

const AuthContext = createContext({
  ...initialState,
  method: 'JWT',
  login: (_email: string, _password: string) => Promise.resolve(),
  logout: () => {},
  register: (_email: string, _password: string, _username: string) =>
    Promise.resolve(),
});

// props type
type AuthProviderProps = {
  children: ReactNode;
};

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [state, dispatch] = useReducer(reducer, initialState);

  const extractUser = (data: unknown) => {
    if (data && typeof data === 'object' && 'user' in data) {
      // @ts-expect-error - runtime guard for unknown payload
      return data.user;
    }
    return data;
  };

  const loginWithBackend = async (email: string, password: string) => {
    const form = new URLSearchParams();
    form.set('username', email);
    form.set('password', password);

    const tokenResponse = await axios.post('/api/auth/token', form, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    });

    // Backend returns { access_token, token_type }
    // @ts-expect-error - response data typing
    const { access_token } = tokenResponse.data;

    setSession(access_token);

    const meResponse = await axios.get('/api/auth/me');
    const user = extractUser(meResponse.data);

    dispatch({
      type: Types.Login,
      payload: { user },
    });
  };

  const loginWithMock = async (email: string, password: string) => {
    const response = await axios.post('/api/auth/login', {
      email,
      password,
    });

    //@ts-expect-error - response data typing
    const { accessToken, user } = response.data;

    setSession(accessToken);
    dispatch({
      type: Types.Login,
      payload: { user },
    });
  };

  const login = async (email: string, password: string) => {
    try {
      if (devConfig.useMockData && import.meta.env.DEV) {
        await loginWithMock(email, password);
        return;
      }

      await loginWithBackend(email, password);
    } catch (backendError) {
      // Dev fallback for demo/dev flows (fake API)
      if (import.meta.env.DEV) {
        await loginWithMock(email, password);
        return;
      }
      throw backendError;
    }
  };

  const register = async (
    email: string,
    username: string,
    password: string
  ) => {
    const response = await axios.post('/api/auth/register', {
      email,
      username,
      password,
    });
    // @ts-expect-error - response data typing
    const { accessToken, user } = response.data;
    setSession(accessToken);
    console.log(response.data);

    dispatch({
      type: Types.Register,
      payload: {
        user,
      },
    });
  };

  const logout = () => {
    setSession(null);
    dispatch({ type: Types.Logout });
  };

  useEffect(() => {
    (async () => {
      try {
        const accessToken = window.localStorage.getItem('accessToken');

        if (accessToken && isValidToken(accessToken)) {
          setSession(accessToken);

          let user: AuthUser = null;
          try {
            if (devConfig.useMockData && import.meta.env.DEV) {
              const response = await axios.get('/api/auth/profile');
              user = extractUser(response.data) as AuthUser;
            } else {
              const response = await axios.get('/api/auth/me');
              user = extractUser(response.data) as AuthUser;
            }
          } catch (err) {
            // Fallback between backend/mock endpoints (e.g. backend down in dev)
            const response = await axios.get('/api/auth/profile');
            user = extractUser(response.data) as AuthUser;
          }

          dispatch({
            type: Types.Init,
            payload: {
              user: user as AuthUser,
              isAuthenticated: true,
            },
          });
        } else {
          dispatch({
            type: Types.Init,
            payload: {
              user: null,
              isAuthenticated: false,
            },
          });
        }
      } catch (err) {
        console.error(err);
        dispatch({
          type: Types.Init,
          payload: {
            user: null,
            isAuthenticated: false,
          },
        });
      }
    })();
  }, []);

  if (!state.isInitialized) {
    return <LoadingScreen />;
  }

  return (
    <AuthContext.Provider
      value={{
        ...state,
        method: 'JWT',
        login,
        logout,
        register,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
