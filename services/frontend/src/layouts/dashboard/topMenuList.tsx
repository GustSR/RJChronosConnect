import { Analytics, DeviceHub, People, Router } from '@mui/icons-material';

const index = [
  // Dashboard Section
  {
    title: 'Dashboard',
    Icon: Analytics,
    category: 'dashboard',
    children: [
      {
        title: 'Análises Geral',
        path: '/dashboard',
      },
    ],
  },

  // Management Section
  {
    title: 'Provisionamento',
    Icon: Router,
    category: 'management',
    path: '/provisionar',
  },
  {
    title: 'Clientes',
    Icon: People,
    category: 'management',
    path: '/clientes',
  },

  // OLT Management Section
  {
    title: 'Gerenciar OLTs',
    Icon: DeviceHub,
    category: 'management',
    path: '/olts',
  },
];

export default index;
