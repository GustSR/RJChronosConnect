import { LoadingScreen } from '@shared/ui/components';
import { createContext, ReactNode, useEffect, useReducer } from 'react';
import { createAuthClient } from 'better-auth/client';

// Types
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

type AuthPayload = {
  [Types.Init]: {
    isAuthenticated: boolean;
    user: AuthUser;
  };
  [Types.Logout]: undefined;
  [Types.Login]: { user: AuthUser };
  [Types.Register]: { user: AuthUser };
};

type ActionMap<M extends { [index: string]: unknown }> = {
  [Key in keyof M]: M[Key] extends undefined
    ? { type: Key }
    : { type: Key; payload: M[Key] };
};

type AuthActions = ActionMap<AuthPayload>[keyof ActionMap<AuthPayload>];

const initialState: AuthState = {
  isAuthenticated: false,
  isInitialized: false,
  user: null,
};

const authClient = createAuthClient(
  import.meta.env.VITE_BETTER_AUTH_BASE_URL
    ? { baseURL: import.meta.env.VITE_BETTER_AUTH_BASE_URL }
    : {}
);

const reducer = (state: AuthState, action: AuthActions) => {
  switch (action.type) {
    case 'INIT':
      return {
        isInitialized: true,
        user: action.payload.user,
        isAuthenticated: action.payload.isAuthenticated,
      };
    case 'LOGIN':
    case 'REGISTER':
      return {
        ...state,
        isAuthenticated: true,
        user: action.payload.user,
      };
    case 'LOGOUT':
      return {
        ...state,
        user: null,
        isAuthenticated: false,
      };
    default:
      return state;
  }
};

const AuthContext = createContext({
  ...initialState,
  method: 'BetterAuth',
  login: (_email: string, _password: string) => Promise.resolve(),
  logout: () => {},
  register: (_email: string, _password: string, _username: string) =>
    Promise.resolve(),
});

type AuthProviderProps = {
  children: ReactNode;
};

const extractUser = (data: unknown): AuthUser => {
  if (data && typeof data === 'object' && 'user' in data) {
    return (data as { user: AuthUser }).user;
  }
  return data as AuthUser;
};

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [state, dispatch] = useReducer(reducer, initialState);

  const login = async (email: string, password: string) => {
    const { data, error } = await authClient.signIn.email({
      email,
      password,
      rememberMe: true,
    });

    if (error) {
      throw new Error(error.message || 'Falha ao autenticar');
    }

    const user = extractUser(data);
    if (!user) {
      throw new Error('Sessao nao encontrada apos login');
    }

    dispatch({ type: Types.Login, payload: { user } });
  };

  const register = async (
    email: string,
    username: string,
    password: string
  ) => {
    const { data, error } = await authClient.signUp.email({
      email,
      password,
      name: username,
    });

    if (error) {
      throw new Error(error.message || 'Falha ao registrar');
    }

    const user = extractUser(data);
    if (!user) {
      throw new Error('Sessao nao encontrada apos cadastro');
    }

    dispatch({ type: Types.Register, payload: { user } });
  };

  const logout = () => {
    authClient.signOut().finally(() => {
      dispatch({ type: Types.Logout });
    });
  };

  useEffect(() => {
    (async () => {
      try {
        const { data, error } = await authClient.getSession();

        if (error || !data) {
          dispatch({
            type: Types.Init,
            payload: { user: null, isAuthenticated: false },
          });
          return;
        }

        const user = extractUser(data);
        dispatch({
          type: Types.Init,
          payload: { user, isAuthenticated: Boolean(user) },
        });
      } catch (err) {
        console.error(err);
        dispatch({
          type: Types.Init,
          payload: { user: null, isAuthenticated: false },
        });
      }
    })();
  }, []);

  if (!state.isInitialized) {
    return <LoadingScreen />;
  }

  return (
    <AuthContext.Provider
      value={{ ...state, method: 'BetterAuth', login, logout, register }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
