# RJChronos - Guia Completo para Desenvolvimento Frontend

**Autor**: Manus AI  
**Data**: 13 de Agosto de 2025  
**Versão**: 1.0  
**Tipo**: Guia de Desenvolvimento Técnico

## Sumário Executivo

Este documento serve como guia definitivo para o desenvolvimento do frontend do RJChronos, fornecendo instruções detalhadas, especificações técnicas, padrões de código e melhores práticas para criar uma interface moderna, performática e intuitiva. O guia está estruturado para permitir que desenvolvedores implementem rapidamente um MVP funcional que supere as expectativas dos usuários acostumados com soluções tradicionais de gerenciamento de telecomunicações.

O frontend do RJChronos utiliza as tecnologias mais modernas disponíveis em 2025, incluindo React 19, TypeScript 5.3+, Material-UI v7, e Vite 7+, criando uma experiência de usuário superior que combina performance, usabilidade e recursos avançados de visualização de dados.

## 1. Configuração do Ambiente de Desenvolvimento

### 1.1 Pré-requisitos e Instalação

O desenvolvimento do frontend RJChronos requer um ambiente moderno com as seguintes dependências instaladas:

**Node.js e Gerenciador de Pacotes**:
```bash
# Instalar Node.js 18+ (recomendado: 20.x LTS)
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Verificar instalação
node --version  # deve ser >= 18.0.0
npm --version   # deve ser >= 9.0.0

# Instalar pnpm (recomendado para performance)
npm install -g pnpm
```

**Ferramentas de Desenvolvimento**:
```bash
# Git para controle de versão
sudo apt-get install git

# VS Code (recomendado)
wget -qO- https://packages.microsoft.com/keys/microsoft.asc | gpg --dearmor > packages.microsoft.gpg
sudo install -o root -g root -m 644 packages.microsoft.gpg /etc/apt/trusted.gpg.d/
sudo sh -c 'echo "deb [arch=amd64,arm64,armhf signed-by=/etc/apt/trusted.gpg.d/packages.microsoft.gpg] https://packages.microsoft.com/repos/code stable main" > /etc/apt/sources.list.d/vscode.list'
sudo apt update
sudo apt install code
```

### 1.2 Criação do Projeto

**Inicialização com Vite**:
```bash
# Criar projeto React com TypeScript
pnpm create vite rjchronos-frontend --template react-ts
cd rjchronos-frontend

# Instalar dependências base
pnpm install

# Instalar dependências específicas do projeto
pnpm add @mui/material @emotion/react @emotion/styled
pnpm add @mui/icons-material @mui/x-data-grid @mui/x-charts
pnpm add @mui/x-date-pickers @mui/lab
pnpm add react-router-dom@6 react-hook-form
pnpm add @hookform/resolvers zod
pnpm add zustand axios socket.io-client
pnpm add recharts d3 @types/d3
pnpm add date-fns lodash @types/lodash

# Dependências de desenvolvimento
pnpm add -D @types/node @vitejs/plugin-react
pnpm add -D eslint @typescript-eslint/eslint-plugin
pnpm add -D prettier eslint-config-prettier
pnpm add -D vitest @testing-library/react @testing-library/jest-dom
pnpm add -D @testing-library/user-event jsdom
```

### 1.3 Configuração do Vite

**vite.config.ts**:
```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@components': path.resolve(__dirname, './src/components'),
      '@pages': path.resolve(__dirname, './src/pages'),
      '@hooks': path.resolve(__dirname, './src/hooks'),
      '@services': path.resolve(__dirname, './src/services'),
      '@store': path.resolve(__dirname, './src/store'),
      '@utils': path.resolve(__dirname, './src/utils'),
      '@types': path.resolve(__dirname, './src/types'),
      '@assets': path.resolve(__dirname, './src/assets')
    }
  },
  server: {
    port: 3000,
    host: true,
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
        secure: false
      }
    }
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          mui: ['@mui/material', '@mui/icons-material'],
          charts: ['recharts', 'd3']
        }
      }
    }
  },
  optimizeDeps: {
    include: ['react', 'react-dom', '@mui/material', '@emotion/react', '@emotion/styled']
  }
})
```

### 1.4 Configuração do TypeScript

**tsconfig.json**:
```json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"],
      "@components/*": ["./src/components/*"],
      "@pages/*": ["./src/pages/*"],
      "@hooks/*": ["./src/hooks/*"],
      "@services/*": ["./src/services/*"],
      "@store/*": ["./src/store/*"],
      "@utils/*": ["./src/utils/*"],
      "@types/*": ["./src/types/*"],
      "@assets/*": ["./src/assets/*"]
    }
  },
  "include": ["src"],
  "references": [{ "path": "./tsconfig.node.json" }]
}
```

## 2. Estrutura do Projeto

### 2.1 Organização de Diretórios

A estrutura do projeto segue padrões modernos de organização, facilitando manutenção e escalabilidade:

```
src/
├── components/           # Componentes reutilizáveis
│   ├── ui/              # Componentes base (Button, Input, etc.)
│   │   ├── Button/
│   │   ├── Input/
│   │   ├── Modal/
│   │   └── index.ts
│   ├── layout/          # Componentes de layout
│   │   ├── AppLayout/
│   │   ├── Sidebar/
│   │   ├── Header/
│   │   └── index.ts
│   ├── charts/          # Componentes de gráficos
│   │   ├── LineChart/
│   │   ├── BarChart/
│   │   ├── PieChart/
│   │   └── index.ts
│   ├── forms/           # Formulários especializados
│   │   ├── DeviceForm/
│   │   ├── UserForm/
│   │   └── index.ts
│   ├── tables/          # Tabelas de dados
│   │   ├── DeviceTable/
│   │   ├── AlertTable/
│   │   └── index.ts
│   └── common/          # Componentes comuns
│       ├── LoadingSpinner/
│       ├── ErrorBoundary/
│       └── index.ts
├── pages/               # Páginas da aplicação
│   ├── Dashboard/
│   ├── Devices/
│   ├── Monitoring/
│   ├── Analytics/
│   ├── Settings/
│   └── Auth/
├── hooks/               # Custom hooks
│   ├── useAuth.ts
│   ├── useDevices.ts
│   ├── useRealtime.ts
│   └── index.ts
├── services/            # APIs e integrações
│   ├── api/
│   │   ├── devices.ts
│   │   ├── monitoring.ts
│   │   └── auth.ts
│   ├── websocket/
│   └── index.ts
├── store/               # Estado global (Zustand)
│   ├── authStore.ts
│   ├── deviceStore.ts
│   ├── uiStore.ts
│   └── index.ts
├── utils/               # Utilitários
│   ├── formatters.ts
│   ├── validators.ts
│   ├── constants.ts
│   └── helpers.ts
├── types/               # Definições TypeScript
│   ├── api.ts
│   ├── device.ts
│   ├── user.ts
│   └── index.ts
├── assets/              # Assets estáticos
│   ├── images/
│   ├── icons/
│   └── fonts/
├── styles/              # Estilos globais
│   ├── theme.ts
│   ├── globals.css
│   └── components.css
├── App.tsx              # Componente principal
├── main.tsx             # Entry point
└── vite-env.d.ts        # Tipos do Vite
```

### 2.2 Convenções de Nomenclatura

**Arquivos e Diretórios**:
- Componentes: PascalCase (ex: `DeviceTable`)
- Hooks: camelCase com prefixo `use` (ex: `useDevices`)
- Utilitários: camelCase (ex: `formatDate`)
- Tipos: PascalCase (ex: `DeviceType`)
- Constantes: UPPER_SNAKE_CASE (ex: `API_BASE_URL`)

**Componentes**:
```typescript
// Estrutura padrão de componente
src/components/ui/Button/
├── Button.tsx           # Componente principal
├── Button.types.ts      # Tipos específicos
├── Button.styles.ts     # Estilos (se necessário)
├── Button.test.tsx      # Testes
└── index.ts             # Export barrel
```

## 3. Sistema de Design e Temas

### 3.1 Configuração do Material-UI

**src/styles/theme.ts**:
```typescript
import { createTheme, ThemeOptions } from '@mui/material/styles';
import { ptBR } from '@mui/material/locale';

// Paleta de cores personalizada
const palette = {
  primary: {
    main: '#1976D2',
    light: '#42A5F5',
    dark: '#1565C0',
    contrastText: '#ffffff'
  },
  secondary: {
    main: '#00ACC1',
    light: '#4DD0E1',
    dark: '#00838F',
    contrastText: '#ffffff'
  },
  success: {
    main: '#4CAF50',
    light: '#81C784',
    dark: '#388E3C'
  },
  warning: {
    main: '#FF9800',
    light: '#FFB74D',
    dark: '#F57C00'
  },
  error: {
    main: '#F44336',
    light: '#EF5350',
    dark: '#D32F2F'
  },
  grey: {
    50: '#FAFAFA',
    100: '#F5F5F5',
    200: '#EEEEEE',
    300: '#E0E0E0',
    400: '#BDBDBD',
    500: '#9E9E9E',
    600: '#757575',
    700: '#616161',
    800: '#424242',
    900: '#212121'
  },
  background: {
    default: '#FAFAFA',
    paper: '#FFFFFF'
  }
};

// Tipografia personalizada
const typography = {
  fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
  h1: {
    fontSize: '2rem',
    fontWeight: 600,
    lineHeight: 1.2
  },
  h2: {
    fontSize: '1.75rem',
    fontWeight: 600,
    lineHeight: 1.3
  },
  h3: {
    fontSize: '1.5rem',
    fontWeight: 600,
    lineHeight: 1.4
  },
  h4: {
    fontSize: '1.25rem',
    fontWeight: 600,
    lineHeight: 1.4
  },
  h5: {
    fontSize: '1.125rem',
    fontWeight: 600,
    lineHeight: 1.5
  },
  h6: {
    fontSize: '1rem',
    fontWeight: 600,
    lineHeight: 1.5
  },
  body1: {
    fontSize: '1rem',
    lineHeight: 1.5
  },
  body2: {
    fontSize: '0.875rem',
    lineHeight: 1.43
  },
  caption: {
    fontSize: '0.75rem',
    lineHeight: 1.66
  }
};

// Componentes customizados
const components = {
  MuiButton: {
    styleOverrides: {
      root: {
        textTransform: 'none' as const,
        borderRadius: 8,
        fontWeight: 500,
        padding: '8px 16px'
      },
      contained: {
        boxShadow: 'none',
        '&:hover': {
          boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.1)'
        }
      }
    }
  },
  MuiCard: {
    styleOverrides: {
      root: {
        borderRadius: 12,
        boxShadow: '0px 1px 3px rgba(0, 0, 0, 0.1)',
        '&:hover': {
          boxShadow: '0px 4px 8px rgba(0, 0, 0, 0.15)'
        }
      }
    }
  },
  MuiTextField: {
    styleOverrides: {
      root: {
        '& .MuiOutlinedInput-root': {
          borderRadius: 8
        }
      }
    }
  },
  MuiDataGrid: {
    styleOverrides: {
      root: {
        border: 'none',
        '& .MuiDataGrid-cell': {
          borderBottom: '1px solid #f0f0f0'
        },
        '& .MuiDataGrid-columnHeaders': {
          backgroundColor: '#fafafa',
          borderBottom: '2px solid #e0e0e0'
        }
      }
    }
  }
};

// Tema principal
const themeOptions: ThemeOptions = {
  palette,
  typography,
  components,
  shape: {
    borderRadius: 8
  },
  spacing: 8
};

export const theme = createTheme(themeOptions, ptBR);

// Tema escuro (opcional)
export const darkTheme = createTheme({
  ...themeOptions,
  palette: {
    ...palette,
    mode: 'dark',
    background: {
      default: '#121212',
      paper: '#1E1E1E'
    }
  }
}, ptBR);
```

### 3.2 Configuração Global de Estilos

**src/styles/globals.css**:
```css
/* Reset e configurações globais */
* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

html {
  height: 100%;
  scroll-behavior: smooth;
}

body {
  height: 100%;
  font-family: 'Inter', 'Roboto', 'Helvetica', 'Arial', sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

#root {
  height: 100%;
  display: flex;
  flex-direction: column;
}

/* Scrollbar customizada */
::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 4px;
}

::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 4px;
}

::-webkit-scrollbar-thumb:hover {
  background: #a8a8a8;
}

/* Animações globais */
@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes slideIn {
  from {
    transform: translateX(-100%);
  }
  to {
    transform: translateX(0);
  }
}

@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}

/* Classes utilitárias */
.fade-in {
  animation: fadeIn 0.3s ease-out;
}

.slide-in {
  animation: slideIn 0.3s ease-out;
}

.pulse {
  animation: pulse 2s infinite;
}

/* Responsividade */
.container {
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 16px;
}

@media (min-width: 768px) {
  .container {
    padding: 0 24px;
  }
}

@media (min-width: 1024px) {
  .container {
    padding: 0 32px;
  }
}

/* Estados de loading */
.skeleton {
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
  background-size: 200% 100%;
  animation: loading 1.5s infinite;
}

@keyframes loading {
  0% {
    background-position: 200% 0;
  }
  100% {
    background-position: -200% 0;
  }
}

/* Print styles */
@media print {
  .no-print {
    display: none !important;
  }
  
  .print-break {
    page-break-before: always;
  }
}
```

## 4. Componentes Base e Reutilizáveis

### 4.1 Componente Button Customizado

**src/components/ui/Button/Button.tsx**:
```typescript
import React from 'react';
import {
  Button as MuiButton,
  ButtonProps as MuiButtonProps,
  CircularProgress,
  Box
} from '@mui/material';
import { styled } from '@mui/material/styles';

export interface ButtonProps extends Omit<MuiButtonProps, 'color'> {
  loading?: boolean;
  icon?: React.ReactNode;
  iconPosition?: 'start' | 'end';
  color?: 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'info';
}

const StyledButton = styled(MuiButton)<ButtonProps>(({ theme, loading }) => ({
  position: 'relative',
  transition: 'all 0.2s ease-in-out',
  '&:hover': {
    transform: 'translateY(-1px)',
    boxShadow: theme.shadows[4]
  },
  '&:active': {
    transform: 'translateY(0)'
  },
  ...(loading && {
    color: 'transparent'
  })
}));

const LoadingSpinner = styled(CircularProgress)(({ theme }) => ({
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  color: 'inherit'
}));

export const Button: React.FC<ButtonProps> = ({
  children,
  loading = false,
  disabled,
  icon,
  iconPosition = 'start',
  ...props
}) => {
  const isDisabled = disabled || loading;

  const renderContent = () => {
    if (loading) {
      return (
        <>
          {children}
          <LoadingSpinner size={20} />
        </>
      );
    }

    if (icon) {
      return (
        <Box display="flex" alignItems="center" gap={1}>
          {iconPosition === 'start' && icon}
          {children}
          {iconPosition === 'end' && icon}
        </Box>
      );
    }

    return children;
  };

  return (
    <StyledButton
      {...props}
      disabled={isDisabled}
      loading={loading}
    >
      {renderContent()}
    </StyledButton>
  );
};
```

### 4.2 Componente Input Customizado

**src/components/ui/Input/Input.tsx**:
```typescript
import React from 'react';
import {
  TextField,
  TextFieldProps,
  InputAdornment,
  IconButton,
  Box,
  Typography
} from '@mui/material';
import { Visibility, VisibilityOff } from '@mui/icons-material';

export interface InputProps extends Omit<TextFieldProps, 'variant'> {
  startIcon?: React.ReactNode;
  endIcon?: React.ReactNode;
  showPasswordToggle?: boolean;
  description?: string;
  variant?: 'outlined' | 'filled' | 'standard';
}

export const Input: React.FC<InputProps> = ({
  startIcon,
  endIcon,
  showPasswordToggle = false,
  description,
  type: initialType = 'text',
  variant = 'outlined',
  ...props
}) => {
  const [showPassword, setShowPassword] = React.useState(false);
  const [type, setType] = React.useState(initialType);

  React.useEffect(() => {
    if (showPasswordToggle && initialType === 'password') {
      setType(showPassword ? 'text' : 'password');
    }
  }, [showPassword, showPasswordToggle, initialType]);

  const handleTogglePassword = () => {
    setShowPassword(!showPassword);
  };

  const renderStartAdornment = () => {
    if (startIcon) {
      return (
        <InputAdornment position="start">
          {startIcon}
        </InputAdornment>
      );
    }
    return null;
  };

  const renderEndAdornment = () => {
    const elements = [];

    if (showPasswordToggle && initialType === 'password') {
      elements.push(
        <IconButton
          key="password-toggle"
          onClick={handleTogglePassword}
          edge="end"
          size="small"
        >
          {showPassword ? <VisibilityOff /> : <Visibility />}
        </IconButton>
      );
    }

    if (endIcon) {
      elements.push(
        <Box key="end-icon" sx={{ ml: 1 }}>
          {endIcon}
        </Box>
      );
    }

    if (elements.length > 0) {
      return (
        <InputAdornment position="end">
          <Box display="flex" alignItems="center">
            {elements}
          </Box>
        </InputAdornment>
      );
    }

    return null;
  };

  return (
    <Box>
      <TextField
        {...props}
        type={type}
        variant={variant}
        fullWidth
        InputProps={{
          startAdornment: renderStartAdornment(),
          endAdornment: renderEndAdornment(),
          ...props.InputProps
        }}
      />
      {description && (
        <Typography
          variant="caption"
          color="textSecondary"
          sx={{ mt: 0.5, display: 'block' }}
        >
          {description}
        </Typography>
      )}
    </Box>
  );
};
```

### 4.3 Componente Modal Customizado

**src/components/ui/Modal/Modal.tsx**:
```typescript
import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Box,
  Typography,
  Slide,
  useMediaQuery,
  useTheme
} from '@mui/material';
import { Close } from '@mui/icons-material';
import { TransitionProps } from '@mui/material/transitions';

const Transition = React.forwardRef<
  unknown,
  TransitionProps & { children: React.ReactElement }
>((props, ref) => <Slide direction="up" ref={ref} {...props} />);

export interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  subtitle?: string;
  children: React.ReactNode;
  actions?: React.ReactNode;
  maxWidth?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  fullScreen?: boolean;
  disableBackdropClick?: boolean;
  disableEscapeKeyDown?: boolean;
}

export const Modal: React.FC<ModalProps> = ({
  open,
  onClose,
  title,
  subtitle,
  children,
  actions,
  maxWidth = 'sm',
  fullScreen = false,
  disableBackdropClick = false,
  disableEscapeKeyDown = false
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const handleClose = (event: {}, reason: 'backdropClick' | 'escapeKeyDown') => {
    if (reason === 'backdropClick' && disableBackdropClick) return;
    if (reason === 'escapeKeyDown' && disableEscapeKeyDown) return;
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth={maxWidth}
      fullWidth
      fullScreen={fullScreen || isMobile}
      TransitionComponent={Transition}
      sx={{
        '& .MuiDialog-paper': {
          borderRadius: fullScreen || isMobile ? 0 : 2,
          margin: isMobile ? 0 : 2
        }
      }}
    >
      {(title || subtitle) && (
        <DialogTitle>
          <Box display="flex" justifyContent="space-between" alignItems="flex-start">
            <Box>
              {title && (
                <Typography variant="h6" component="h2">
                  {title}
                </Typography>
              )}
              {subtitle && (
                <Typography variant="body2" color="textSecondary">
                  {subtitle}
                </Typography>
              )}
            </Box>
            <IconButton
              onClick={onClose}
              size="small"
              sx={{ ml: 2, mt: -0.5 }}
            >
              <Close />
            </IconButton>
          </Box>
        </DialogTitle>
      )}
      
      <DialogContent dividers>
        {children}
      </DialogContent>
      
      {actions && (
        <DialogActions sx={{ p: 2 }}>
          {actions}
        </DialogActions>
      )}
    </Dialog>
  );
};
```

## 5. Gerenciamento de Estado

### 5.1 Configuração do Zustand

**src/store/authStore.ts**:
```typescript
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { authService } from '@/services/api/auth';

export interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  permissions: string[];
  organizationId: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

interface AuthActions {
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  refreshToken: () => Promise<void>;
  clearError: () => void;
  setUser: (user: User) => void;
}

export const useAuthStore = create<AuthState & AuthActions>()(
  persist(
    (set, get) => ({
      // Estado inicial
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      // Ações
      login: async (email: string, password: string) => {
        set({ isLoading: true, error: null });
        
        try {
          const response = await authService.login({ email, password });
          const { user, token } = response.data;
          
          set({
            user,
            token,
            isAuthenticated: true,
            isLoading: false,
            error: null
          });
        } catch (error: any) {
          set({
            error: error.response?.data?.message || 'Erro ao fazer login',
            isLoading: false
          });
          throw error;
        }
      },

      logout: () => {
        set({
          user: null,
          token: null,
          isAuthenticated: false,
          error: null
        });
      },

      refreshToken: async () => {
        const { token } = get();
        if (!token) return;

        try {
          const response = await authService.refreshToken(token);
          const { token: newToken } = response.data;
          
          set({ token: newToken });
        } catch (error) {
          // Token inválido, fazer logout
          get().logout();
        }
      },

      clearError: () => set({ error: null }),

      setUser: (user: User) => set({ user })
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated
      })
    }
  )
);
```

### 5.2 Store de Dispositivos

**src/store/deviceStore.ts**:
```typescript
import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { deviceService } from '@/services/api/devices';

export interface Device {
  id: string;
  serialNumber: string;
  deviceType: 'cpe' | 'ont' | 'router' | 'switch';
  manufacturer: string;
  model: string;
  firmwareVersion: string;
  status: 'online' | 'offline' | 'error';
  lastSeen: string;
  signalLevel?: number;
  customer: {
    id: string;
    name: string;
    address: string;
  };
  location?: {
    latitude: number;
    longitude: number;
  };
  configuration: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

interface DeviceFilters {
  status?: string[];
  deviceType?: string[];
  manufacturer?: string[];
  search?: string;
}

interface DeviceState {
  devices: Device[];
  selectedDevices: string[];
  filters: DeviceFilters;
  isLoading: boolean;
  error: string | null;
  pagination: {
    page: number;
    pageSize: number;
    total: number;
  };
}

interface DeviceActions {
  fetchDevices: () => Promise<void>;
  fetchDevice: (id: string) => Promise<Device>;
  createDevice: (device: Partial<Device>) => Promise<void>;
  updateDevice: (id: string, updates: Partial<Device>) => Promise<void>;
  deleteDevice: (id: string) => Promise<void>;
  bulkAction: (deviceIds: string[], action: string) => Promise<void>;
  setSelectedDevices: (deviceIds: string[]) => void;
  setFilters: (filters: DeviceFilters) => void;
  setPagination: (pagination: Partial<DeviceState['pagination']>) => void;
  clearError: () => void;
}

export const useDeviceStore = create<DeviceState & DeviceActions>()(
  devtools(
    (set, get) => ({
      // Estado inicial
      devices: [],
      selectedDevices: [],
      filters: {},
      isLoading: false,
      error: null,
      pagination: {
        page: 0,
        pageSize: 25,
        total: 0
      },

      // Ações
      fetchDevices: async () => {
        set({ isLoading: true, error: null });
        
        try {
          const { filters, pagination } = get();
          const response = await deviceService.getDevices({
            ...filters,
            page: pagination.page,
            pageSize: pagination.pageSize
          });
          
          set({
            devices: response.data.items,
            pagination: {
              ...pagination,
              total: response.data.total
            },
            isLoading: false
          });
        } catch (error: any) {
          set({
            error: error.response?.data?.message || 'Erro ao carregar dispositivos',
            isLoading: false
          });
        }
      },

      fetchDevice: async (id: string) => {
        try {
          const response = await deviceService.getDevice(id);
          return response.data;
        } catch (error: any) {
          set({
            error: error.response?.data?.message || 'Erro ao carregar dispositivo'
          });
          throw error;
        }
      },

      createDevice: async (device: Partial<Device>) => {
        set({ isLoading: true, error: null });
        
        try {
          await deviceService.createDevice(device);
          await get().fetchDevices(); // Recarregar lista
          set({ isLoading: false });
        } catch (error: any) {
          set({
            error: error.response?.data?.message || 'Erro ao criar dispositivo',
            isLoading: false
          });
          throw error;
        }
      },

      updateDevice: async (id: string, updates: Partial<Device>) => {
        try {
          await deviceService.updateDevice(id, updates);
          
          // Atualizar dispositivo na lista local
          set(state => ({
            devices: state.devices.map(device =>
              device.id === id ? { ...device, ...updates } : device
            )
          }));
        } catch (error: any) {
          set({
            error: error.response?.data?.message || 'Erro ao atualizar dispositivo'
          });
          throw error;
        }
      },

      deleteDevice: async (id: string) => {
        try {
          await deviceService.deleteDevice(id);
          
          // Remover dispositivo da lista local
          set(state => ({
            devices: state.devices.filter(device => device.id !== id),
            selectedDevices: state.selectedDevices.filter(deviceId => deviceId !== id)
          }));
        } catch (error: any) {
          set({
            error: error.response?.data?.message || 'Erro ao excluir dispositivo'
          });
          throw error;
        }
      },

      bulkAction: async (deviceIds: string[], action: string) => {
        set({ isLoading: true, error: null });
        
        try {
          await deviceService.bulkAction(deviceIds, action);
          await get().fetchDevices(); // Recarregar lista
          set({ selectedDevices: [], isLoading: false });
        } catch (error: any) {
          set({
            error: error.response?.data?.message || 'Erro ao executar ação em lote',
            isLoading: false
          });
          throw error;
        }
      },

      setSelectedDevices: (deviceIds: string[]) => {
        set({ selectedDevices: deviceIds });
      },

      setFilters: (filters: DeviceFilters) => {
        set({ filters, pagination: { ...get().pagination, page: 0 } });
        get().fetchDevices();
      },

      setPagination: (pagination: Partial<DeviceState['pagination']>) => {
        set(state => ({
          pagination: { ...state.pagination, ...pagination }
        }));
        get().fetchDevices();
      },

      clearError: () => set({ error: null })
    }),
    { name: 'device-store' }
  )
);
```

## 6. Serviços e APIs

### 6.1 Configuração do Cliente HTTP

**src/services/api/client.ts**:
```typescript
import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import { useAuthStore } from '@/store/authStore';

// Configuração base do cliente HTTP
const createApiClient = (): AxiosInstance => {
  const client = axios.create({
    baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api',
    timeout: 30000,
    headers: {
      'Content-Type': 'application/json'
    }
  });

  // Interceptor de requisição para adicionar token
  client.interceptors.request.use(
    (config) => {
      const { token } = useAuthStore.getState();
      
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      
      return config;
    },
    (error) => Promise.reject(error)
  );

  // Interceptor de resposta para tratar erros
  client.interceptors.response.use(
    (response: AxiosResponse) => response,
    async (error) => {
      const { response } = error;
      
      if (response?.status === 401) {
        // Token expirado, tentar renovar
        const { refreshToken, logout } = useAuthStore.getState();
        
        try {
          await refreshToken();
          // Repetir requisição original
          return client.request(error.config);
        } catch (refreshError) {
          // Falha ao renovar token, fazer logout
          logout();
          window.location.href = '/login';
        }
      }
      
      return Promise.reject(error);
    }
  );

  return client;
};

export const apiClient = createApiClient();

// Tipos para respostas da API
export interface ApiResponse<T = any> {
  data: T;
  message?: string;
  success: boolean;
}

export interface PaginatedResponse<T = any> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// Wrapper para requisições com tratamento de erro
export const apiRequest = async <T = any>(
  request: () => Promise<AxiosResponse<ApiResponse<T>>>
): Promise<ApiResponse<T>> => {
  try {
    const response = await request();
    return response.data;
  } catch (error: any) {
    console.error('API Request Error:', error);
    throw error;
  }
};
```

### 6.2 Serviço de Autenticação

**src/services/api/auth.ts**:
```typescript
import { apiClient, apiRequest, ApiResponse } from './client';

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  user: {
    id: string;
    email: string;
    name: string;
    role: string;
    permissions: string[];
    organizationId: string;
  };
  token: string;
  refreshToken: string;
}

export interface RefreshTokenResponse {
  token: string;
}

export const authService = {
  login: (credentials: LoginRequest) =>
    apiRequest<LoginResponse>(() =>
      apiClient.post('/auth/login', credentials)
    ),

  logout: () =>
    apiRequest(() =>
      apiClient.post('/auth/logout')
    ),

  refreshToken: (token: string) =>
    apiRequest<RefreshTokenResponse>(() =>
      apiClient.post('/auth/refresh', { token })
    ),

  forgotPassword: (email: string) =>
    apiRequest(() =>
      apiClient.post('/auth/forgot-password', { email })
    ),

  resetPassword: (token: string, password: string) =>
    apiRequest(() =>
      apiClient.post('/auth/reset-password', { token, password })
    ),

  verifyToken: () =>
    apiRequest(() =>
      apiClient.get('/auth/verify')
    )
};
```

### 6.3 Serviço de Dispositivos

**src/services/api/devices.ts**:
```typescript
import { apiClient, apiRequest, PaginatedResponse } from './client';
import { Device } from '@/store/deviceStore';

export interface DeviceFilters {
  status?: string[];
  deviceType?: string[];
  manufacturer?: string[];
  search?: string;
  page?: number;
  pageSize?: number;
}

export interface DeviceMetrics {
  signalLevel: number;
  uptime: number;
  throughput: {
    upload: number;
    download: number;
  };
  temperature?: number;
  memoryUsage?: number;
  cpuUsage?: number;
}

export interface DeviceCommand {
  command: string;
  parameters?: Record<string, any>;
}

export const deviceService = {
  getDevices: (filters: DeviceFilters = {}) =>
    apiRequest<PaginatedResponse<Device>>(() =>
      apiClient.get('/devices', { params: filters })
    ),

  getDevice: (id: string) =>
    apiRequest<Device>(() =>
      apiClient.get(`/devices/${id}`)
    ),

  createDevice: (device: Partial<Device>) =>
    apiRequest<Device>(() =>
      apiClient.post('/devices', device)
    ),

  updateDevice: (id: string, updates: Partial<Device>) =>
    apiRequest<Device>(() =>
      apiClient.patch(`/devices/${id}`, updates)
    ),

  deleteDevice: (id: string) =>
    apiRequest(() =>
      apiClient.delete(`/devices/${id}`)
    ),

  bulkAction: (deviceIds: string[], action: string) =>
    apiRequest(() =>
      apiClient.post('/devices/bulk-action', { deviceIds, action })
    ),

  getDeviceMetrics: (id: string, timeRange?: string) =>
    apiRequest<DeviceMetrics>(() =>
      apiClient.get(`/devices/${id}/metrics`, {
        params: { timeRange }
      })
    ),

  sendCommand: (id: string, command: DeviceCommand) =>
    apiRequest(() =>
      apiClient.post(`/devices/${id}/commands`, command)
    ),

  getDeviceHistory: (id: string, limit?: number) =>
    apiRequest<any[]>(() =>
      apiClient.get(`/devices/${id}/history`, {
        params: { limit }
      })
    ),

  updateFirmware: (id: string, firmwareUrl: string) =>
    apiRequest(() =>
      apiClient.post(`/devices/${id}/firmware-update`, { firmwareUrl })
    ),

  reboot: (id: string) =>
    apiRequest(() =>
      apiClient.post(`/devices/${id}/reboot`)
    ),

  factoryReset: (id: string) =>
    apiRequest(() =>
      apiClient.post(`/devices/${id}/factory-reset`)
    )
};
```

## 7. Hooks Customizados

### 7.1 Hook de Autenticação

**src/hooks/useAuth.ts**:
```typescript
import { useEffect } from 'react';
import { useAuthStore } from '@/store/authStore';
import { useNavigate } from 'react-router-dom';

export const useAuth = () => {
  const {
    user,
    token,
    isAuthenticated,
    isLoading,
    error,
    login,
    logout,
    clearError
  } = useAuthStore();

  const navigate = useNavigate();

  // Verificar autenticação ao carregar
  useEffect(() => {
    if (!isAuthenticated && token) {
      // Token existe mas usuário não está autenticado
      // Tentar verificar token
      useAuthStore.getState().refreshToken().catch(() => {
        logout();
        navigate('/login');
      });
    }
  }, [isAuthenticated, token, logout, navigate]);

  const handleLogin = async (email: string, password: string) => {
    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (error) {
      // Erro já tratado no store
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const hasPermission = (permission: string): boolean => {
    return user?.permissions?.includes(permission) || false;
  };

  const hasRole = (role: string): boolean => {
    return user?.role === role;
  };

  return {
    user,
    isAuthenticated,
    isLoading,
    error,
    login: handleLogin,
    logout: handleLogout,
    clearError,
    hasPermission,
    hasRole
  };
};
```

### 7.2 Hook de Dados em Tempo Real

**src/hooks/useRealtime.ts**:
```typescript
import { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuthStore } from '@/store/authStore';

interface UseRealtimeOptions {
  autoConnect?: boolean;
  namespace?: string;
}

export const useRealtime = (options: UseRealtimeOptions = {}) => {
  const { autoConnect = true, namespace = '/' } = options;
  const { token, isAuthenticated } = useAuthStore();
  const socketRef = useRef<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated || !token || !autoConnect) {
      return;
    }

    // Criar conexão WebSocket
    const socket = io(
      `${import.meta.env.VITE_WS_URL || 'ws://localhost:8000'}${namespace}`,
      {
        auth: {
          token
        },
        transports: ['websocket']
      }
    );

    socketRef.current = socket;

    // Event listeners
    socket.on('connect', () => {
      setIsConnected(true);
      setError(null);
    });

    socket.on('disconnect', () => {
      setIsConnected(false);
    });

    socket.on('connect_error', (err) => {
      setError(err.message);
      setIsConnected(false);
    });

    // Cleanup
    return () => {
      socket.disconnect();
      socketRef.current = null;
      setIsConnected(false);
    };
  }, [isAuthenticated, token, autoConnect, namespace]);

  const emit = (event: string, data?: any) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit(event, data);
    }
  };

  const on = (event: string, callback: (...args: any[]) => void) => {
    if (socketRef.current) {
      socketRef.current.on(event, callback);
    }
  };

  const off = (event: string, callback?: (...args: any[]) => void) => {
    if (socketRef.current) {
      socketRef.current.off(event, callback);
    }
  };

  const connect = () => {
    if (socketRef.current && !socketRef.current.connected) {
      socketRef.current.connect();
    }
  };

  const disconnect = () => {
    if (socketRef.current?.connected) {
      socketRef.current.disconnect();
    }
  };

  return {
    isConnected,
    error,
    emit,
    on,
    off,
    connect,
    disconnect
  };
};
```

### 7.3 Hook de Métricas em Tempo Real

**src/hooks/useRealtimeMetrics.ts**:
```typescript
import { useState, useEffect } from 'react';
import { useRealtime } from './useRealtime';

export interface RealtimeMetrics {
  activeDevices: number;
  networkUptime: number;
  onlineClients: number;
  averageQoE: number;
  devicesTrend: number;
  uptimeTrend: number;
  clientsTrend: number;
  qoeTrend: number;
  lastUpdated: Date;
}

export const useRealtimeMetrics = () => {
  const [metrics, setMetrics] = useState<RealtimeMetrics>({
    activeDevices: 0,
    networkUptime: 0,
    onlineClients: 0,
    averageQoE: 0,
    devicesTrend: 0,
    uptimeTrend: 0,
    clientsTrend: 0,
    qoeTrend: 0,
    lastUpdated: new Date()
  });

  const [isLoading, setIsLoading] = useState(true);
  const { isConnected, on, off, emit } = useRealtime();

  useEffect(() => {
    if (!isConnected) return;

    // Solicitar métricas iniciais
    emit('request_metrics');

    // Listener para atualizações de métricas
    const handleMetricsUpdate = (data: Partial<RealtimeMetrics>) => {
      setMetrics(prev => ({
        ...prev,
        ...data,
        lastUpdated: new Date()
      }));
      setIsLoading(false);
    };

    on('metrics_update', handleMetricsUpdate);

    // Cleanup
    return () => {
      off('metrics_update', handleMetricsUpdate);
    };
  }, [isConnected, on, off, emit]);

  const refreshMetrics = () => {
    if (isConnected) {
      emit('request_metrics');
    }
  };

  return {
    metrics,
    isLoading,
    isConnected,
    refreshMetrics
  };
};
```

## 8. Páginas Principais

### 8.1 Página de Dashboard

**src/pages/Dashboard/Dashboard.tsx**:
```typescript
import React from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  useTheme
} from '@mui/material';
import {
  Devices,
  NetworkCheck,
  People,
  Speed
} from '@mui/icons-material';
import { MetricCard } from '@/components/common/MetricCard';
import { NetworkStatusMap } from '@/components/charts/NetworkStatusMap';
import { PerformanceChart } from '@/components/charts/PerformanceChart';
import { AlertsFeed } from '@/components/common/AlertsFeed';
import { useRealtimeMetrics } from '@/hooks/useRealtimeMetrics';

export const Dashboard: React.FC = () => {
  const theme = useTheme();
  const { metrics, isLoading } = useRealtimeMetrics();

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Dashboard
        </Typography>
        <Typography variant="body1" color="textSecondary">
          Visão geral da sua rede de telecomunicações
        </Typography>
      </Box>

      {/* Métricas Principais */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            title="Dispositivos Ativos"
            value={metrics.activeDevices}
            trend={metrics.devicesTrend}
            icon={<Devices />}
            color="primary"
            isLoading={isLoading}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            title="Status da Rede"
            value={`${metrics.networkUptime}%`}
            trend={metrics.uptimeTrend}
            icon={<NetworkCheck />}
            color="success"
            isLoading={isLoading}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            title="Clientes Online"
            value={metrics.onlineClients}
            trend={metrics.clientsTrend}
            icon={<People />}
            color="info"
            isLoading={isLoading}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            title="QoE Médio"
            value={metrics.averageQoE}
            trend={metrics.qoeTrend}
            icon={<Speed />}
            color="warning"
            isLoading={isLoading}
          />
        </Grid>
      </Grid>

      {/* Gráficos e Mapas */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} lg={8}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Performance da Rede
              </Typography>
              <PerformanceChart />
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} lg={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Alertas Ativos
              </Typography>
              <AlertsFeed />
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Mapa de Status */}
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Mapa de Status da Rede
              </Typography>
              <NetworkStatusMap />
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};
```

### 8.2 Página de Dispositivos

**src/pages/Devices/Devices.tsx**:
```typescript
import React, { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent
} from '@mui/material';
import { Add, FileDownload } from '@mui/icons-material';
import { DeviceTable } from '@/components/tables/DeviceTable';
import { DeviceFilters } from '@/components/forms/DeviceFilters';
import { DeviceModal } from '@/components/forms/DeviceModal';
import { BulkActionDialog } from '@/components/common/BulkActionDialog';
import { useDeviceStore } from '@/store/deviceStore';

export const Devices: React.FC = () => {
  const {
    devices,
    selectedDevices,
    filters,
    isLoading,
    error,
    fetchDevices,
    setSelectedDevices,
    setFilters,
    bulkAction
  } = useDeviceStore();

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isBulkActionDialogOpen, setIsBulkActionDialogOpen] = useState(false);

  useEffect(() => {
    fetchDevices();
  }, [fetchDevices]);

  const handleExport = () => {
    // Implementar exportação
    console.log('Exportar dispositivos');
  };

  const handleBulkAction = async (action: string) => {
    try {
      await bulkAction(selectedDevices, action);
      setIsBulkActionDialogOpen(false);
    } catch (error) {
      console.error('Erro na ação em lote:', error);
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          mb: 3
        }}
      >
        <Box>
          <Typography variant="h4" component="h1" gutterBottom>
            Dispositivos
          </Typography>
          <Typography variant="body1" color="textSecondary">
            Gerencie todos os dispositivos da sua rede
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            variant="outlined"
            startIcon={<FileDownload />}
            onClick={handleExport}
          >
            Exportar
          </Button>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => setIsCreateModalOpen(true)}
          >
            Adicionar Dispositivo
          </Button>
        </Box>
      </Box>

      {/* Filtros */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <DeviceFilters
            filters={filters}
            onFiltersChange={setFilters}
          />
        </CardContent>
      </Card>

      {/* Ações em Lote */}
      {selectedDevices.length > 0 && (
        <Box sx={{ mb: 2 }}>
          <Button
            variant="outlined"
            onClick={() => setIsBulkActionDialogOpen(true)}
          >
            Ações em Lote ({selectedDevices.length} selecionados)
          </Button>
        </Box>
      )}

      {/* Tabela de Dispositivos */}
      <Card>
        <DeviceTable
          devices={devices}
          selectedDevices={selectedDevices}
          onSelectionChange={setSelectedDevices}
          isLoading={isLoading}
          error={error}
        />
      </Card>

      {/* Modais */}
      <DeviceModal
        open={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        mode="create"
      />

      <BulkActionDialog
        open={isBulkActionDialogOpen}
        onClose={() => setIsBulkActionDialogOpen(false)}
        selectedCount={selectedDevices.length}
        onAction={handleBulkAction}
      />
    </Box>
  );
};
```

## 9. Componentes de Visualização de Dados

### 9.1 Componente de Gráfico de Performance

**src/components/charts/PerformanceChart/PerformanceChart.tsx**:
```typescript
import React, { useState } from 'react';
import {
  Box,
  ToggleButton,
  ToggleButtonGroup,
  useTheme
} from '@mui/material';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import { usePerformanceData } from '@/hooks/usePerformanceData';

type TimeRange = '1h' | '6h' | '24h' | '7d' | '30d';

export const PerformanceChart: React.FC = () => {
  const theme = useTheme();
  const [timeRange, setTimeRange] = useState<TimeRange>('24h');
  const { data, isLoading } = usePerformanceData(timeRange);

  const handleTimeRangeChange = (
    event: React.MouseEvent<HTMLElement>,
    newTimeRange: TimeRange | null
  ) => {
    if (newTimeRange) {
      setTimeRange(newTimeRange);
    }
  };

  if (isLoading) {
    return (
      <Box
        sx={{
          height: 300,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        Carregando...
      </Box>
    );
  }

  return (
    <Box>
      {/* Controles de Período */}
      <Box sx={{ mb: 2, display: 'flex', justifyContent: 'flex-end' }}>
        <ToggleButtonGroup
          value={timeRange}
          exclusive
          onChange={handleTimeRangeChange}
          size="small"
        >
          <ToggleButton value="1h">1h</ToggleButton>
          <ToggleButton value="6h">6h</ToggleButton>
          <ToggleButton value="24h">24h</ToggleButton>
          <ToggleButton value="7d">7d</ToggleButton>
          <ToggleButton value="30d">30d</ToggleButton>
        </ToggleButtonGroup>
      </Box>

      {/* Gráfico */}
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            dataKey="timestamp"
            tickFormatter={(value) => {
              const date = new Date(value);
              return timeRange === '1h' || timeRange === '6h'
                ? date.toLocaleTimeString('pt-BR', { 
                    hour: '2-digit', 
                    minute: '2-digit' 
                  })
                : date.toLocaleDateString('pt-BR', { 
                    month: 'short', 
                    day: 'numeric' 
                  });
            }}
          />
          <YAxis />
          <Tooltip
            labelFormatter={(value) => {
              const date = new Date(value);
              return date.toLocaleString('pt-BR');
            }}
            formatter={(value: number, name: string) => [
              `${value.toFixed(2)} Mbps`,
              name === 'upload' ? 'Upload' : 'Download'
            ]}
          />
          <Legend />
          <Line
            type="monotone"
            dataKey="upload"
            stroke={theme.palette.primary.main}
            strokeWidth={2}
            dot={false}
            name="Upload"
          />
          <Line
            type="monotone"
            dataKey="download"
            stroke={theme.palette.secondary.main}
            strokeWidth={2}
            dot={false}
            name="Download"
          />
        </LineChart>
      </ResponsiveContainer>
    </Box>
  );
};
```

### 9.2 Componente de Mapa de Status

**src/components/charts/NetworkStatusMap/NetworkStatusMap.tsx**:
```typescript
import React, { useState, useEffect } from 'react';
import {
  Box,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  useTheme
} from '@mui/material';
import { MapContainer, TileLayer, Marker, Popup, CircleMarker } from 'react-leaflet';
import { Icon } from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useNetworkMapData } from '@/hooks/useNetworkMapData';

// Ícones personalizados para diferentes status
const createStatusIcon = (status: string, color: string) => {
  return new Icon({
    iconUrl: `data:image/svg+xml;base64,${btoa(`
      <svg width="24" height="24" viewBox="0 0 24 24" fill="${color}" xmlns="http://www.w3.org/2000/svg">
        <circle cx="12" cy="12" r="10" fill="${color}" stroke="white" stroke-width="2"/>
      </svg>
    `)}`,
    iconSize: [24, 24],
    iconAnchor: [12, 12]
  });
};

export const NetworkStatusMap: React.FC = () => {
  const theme = useTheme();
  const [selectedRegion, setSelectedRegion] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const { data, regions, isLoading } = useNetworkMapData({
    region: selectedRegion,
    status: selectedStatus
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online':
        return theme.palette.success.main;
      case 'offline':
        return theme.palette.error.main;
      case 'warning':
        return theme.palette.warning.main;
      default:
        return theme.palette.grey[500];
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'online':
        return 'Online';
      case 'offline':
        return 'Offline';
      case 'warning':
        return 'Atenção';
      default:
        return 'Desconhecido';
    }
  };

  if (isLoading) {
    return (
      <Box
        sx={{
          height: 400,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        Carregando mapa...
      </Box>
    );
  }

  return (
    <Box>
      {/* Controles */}
      <Box sx={{ mb: 2, display: 'flex', gap: 2, alignItems: 'center' }}>
        <FormControl size="small" sx={{ minWidth: 120 }}>
          <InputLabel>Região</InputLabel>
          <Select
            value={selectedRegion}
            label="Região"
            onChange={(e) => setSelectedRegion(e.target.value)}
          >
            <MenuItem value="all">Todas</MenuItem>
            {regions.map((region) => (
              <MenuItem key={region.id} value={region.id}>
                {region.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <FormControl size="small" sx={{ minWidth: 120 }}>
          <InputLabel>Status</InputLabel>
          <Select
            value={selectedStatus}
            label="Status"
            onChange={(e) => setSelectedStatus(e.target.value)}
          >
            <MenuItem value="all">Todos</MenuItem>
            <MenuItem value="online">Online</MenuItem>
            <MenuItem value="offline">Offline</MenuItem>
            <MenuItem value="warning">Atenção</MenuItem>
          </Select>
        </FormControl>

        {/* Legenda */}
        <Box sx={{ ml: 'auto', display: 'flex', gap: 1 }}>
          <Chip
            size="small"
            label="Online"
            sx={{ backgroundColor: theme.palette.success.main, color: 'white' }}
          />
          <Chip
            size="small"
            label="Offline"
            sx={{ backgroundColor: theme.palette.error.main, color: 'white' }}
          />
          <Chip
            size="small"
            label="Atenção"
            sx={{ backgroundColor: theme.palette.warning.main, color: 'white' }}
          />
        </Box>
      </Box>

      {/* Mapa */}
      <Box sx={{ height: 400, borderRadius: 1, overflow: 'hidden' }}>
        <MapContainer
          center={[-23.5505, -46.6333]} // São Paulo como centro padrão
          zoom={10}
          style={{ height: '100%', width: '100%' }}
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          />
          
          {data.map((device) => (
            <Marker
              key={device.id}
              position={[device.latitude, device.longitude]}
              icon={createStatusIcon(device.status, getStatusColor(device.status))}
            >
              <Popup>
                <Box>
                  <strong>{device.name}</strong>
                  <br />
                  Status: {getStatusLabel(device.status)}
                  <br />
                  Tipo: {device.type}
                  <br />
                  Cliente: {device.customerName}
                  {device.signalLevel && (
                    <>
                      <br />
                      Sinal: {device.signalLevel} dBm
                    </>
                  )}
                </Box>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </Box>
    </Box>
  );
};
```

## 10. Testes e Qualidade

### 10.1 Configuração de Testes

**vitest.config.ts**:
```typescript
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    css: true
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@components': path.resolve(__dirname, './src/components'),
      '@pages': path.resolve(__dirname, './src/pages'),
      '@hooks': path.resolve(__dirname, './src/hooks'),
      '@services': path.resolve(__dirname, './src/services'),
      '@store': path.resolve(__dirname, './src/store'),
      '@utils': path.resolve(__dirname, './src/utils'),
      '@types': path.resolve(__dirname, './src/types')
    }
  }
});
```

**src/test/setup.ts**:
```typescript
import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Mock do ResizeObserver
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn()
}));

// Mock do matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn()
  }))
});

// Mock do IntersectionObserver
global.IntersectionObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn()
}));
```

### 10.2 Exemplo de Teste de Componente

**src/components/ui/Button/Button.test.tsx**:
```typescript
import { render, screen, fireEvent } from '@testing-library/react';
import { ThemeProvider } from '@mui/material/styles';
import { Button } from './Button';
import { theme } from '@/styles/theme';

const renderWithTheme = (component: React.ReactElement) => {
  return render(
    <ThemeProvider theme={theme}>
      {component}
    </ThemeProvider>
  );
};

describe('Button Component', () => {
  it('renders correctly', () => {
    renderWithTheme(<Button>Test Button</Button>);
    expect(screen.getByRole('button', { name: 'Test Button' })).toBeInTheDocument();
  });

  it('shows loading state', () => {
    renderWithTheme(<Button loading>Loading Button</Button>);
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it('is disabled when loading', () => {
    renderWithTheme(<Button loading>Loading Button</Button>);
    expect(screen.getByRole('button')).toBeDisabled();
  });

  it('calls onClick when clicked', () => {
    const handleClick = vi.fn();
    renderWithTheme(<Button onClick={handleClick}>Click Me</Button>);
    
    fireEvent.click(screen.getByRole('button'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('renders with icon', () => {
    const TestIcon = () => <span data-testid="test-icon">Icon</span>;
    renderWithTheme(
      <Button icon={<TestIcon />}>Button with Icon</Button>
    );
    
    expect(screen.getByTestId('test-icon')).toBeInTheDocument();
  });
});
```

### 10.3 Exemplo de Teste de Hook

**src/hooks/useAuth.test.ts**:
```typescript
import { renderHook, act } from '@testing-library/react';
import { useAuth } from './useAuth';
import { useAuthStore } from '@/store/authStore';

// Mock do store
vi.mock('@/store/authStore');

describe('useAuth Hook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns initial state', () => {
    const mockStore = {
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
      login: vi.fn(),
      logout: vi.fn(),
      clearError: vi.fn()
    };

    (useAuthStore as any).mockReturnValue(mockStore);

    const { result } = renderHook(() => useAuth());

    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.user).toBeNull();
  });

  it('handles login correctly', async () => {
    const mockLogin = vi.fn().mockResolvedValue(undefined);
    const mockStore = {
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
      login: mockLogin,
      logout: vi.fn(),
      clearError: vi.fn()
    };

    (useAuthStore as any).mockReturnValue(mockStore);

    const { result } = renderHook(() => useAuth());

    await act(async () => {
      await result.current.login('test@example.com', 'password');
    });

    expect(mockLogin).toHaveBeenCalledWith('test@example.com', 'password');
  });
});
```

## 11. Build e Deploy

### 11.1 Scripts de Build

**package.json** (scripts section):
```json
{
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview",
    "test": "vitest",
    "test:ui": "vitest --ui",
    "test:coverage": "vitest --coverage",
    "lint": "eslint . --ext ts,tsx --report-unused-disable-directives --max-warnings 0",
    "lint:fix": "eslint . --ext ts,tsx --fix",
    "type-check": "tsc --noEmit",
    "format": "prettier --write \"src/**/*.{ts,tsx,js,jsx,json,css,md}\"",
    "analyze": "npx vite-bundle-analyzer"
  }
}
```

### 11.2 Configuração de Produção

**src/config/environment.ts**:
```typescript
export const config = {
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api',
  wsUrl: import.meta.env.VITE_WS_URL || 'ws://localhost:8000',
  environment: import.meta.env.MODE,
  isDevelopment: import.meta.env.DEV,
  isProduction: import.meta.env.PROD,
  version: import.meta.env.VITE_APP_VERSION || '1.0.0'
};
```

**.env.example**:
```env
# API Configuration
VITE_API_BASE_URL=http://localhost:8000/api
VITE_WS_URL=ws://localhost:8000

# App Configuration
VITE_APP_VERSION=1.0.0
VITE_APP_NAME=RJChronos

# Feature Flags
VITE_ENABLE_ANALYTICS=true
VITE_ENABLE_REALTIME=true
```

## 12. Conclusão

Este guia fornece uma base sólida para o desenvolvimento do frontend do RJChronos, cobrindo desde a configuração inicial até a implementação de componentes avançados e testes. A arquitetura proposta garante escalabilidade, maintibilidade e performance superior, utilizando as melhores práticas e tecnologias mais modernas disponíveis.

O desenvolvimento deve seguir uma abordagem iterativa, começando com os componentes base e evoluindo gradualmente para funcionalidades mais complexas. A estrutura modular permite que diferentes desenvolvedores trabalhem em paralelo sem conflitos, acelerando o processo de desenvolvimento.

Com esta especificação detalhada, a equipe de desenvolvimento possui todas as informações necessárias para implementar uma interface moderna, intuitiva e performática que estabelecerá o RJChronos como referência no mercado de sistemas de gerenciamento de telecomunicações.

