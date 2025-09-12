import { duotone } from '@shared/ui/icons/duotone';

// Navegação no formato Uko Template com ícones duotone
const navigations = [
  // Dashboard Section - Label
  {
    type: 'label',
    name: 'DASHBOARD',
  },
  {
    name: 'Dashboard',
    icon: duotone.Analytics,
    children: [
      {
        name: 'Análises Geral',
        path: '/dashboard',
      },
      {
        name: 'Dashboard de Clientes',
        path: '/dashboard/clientes',
      },
      {
        name: 'Dashboard de OLTs',
        path: '/dashboard/olts',
      },
    ],
  },

  // Management Section - Label
  {
    type: 'label',
    name: 'MANAGEMENT',
  },
  {
    name: 'Provisionamento',
    icon: duotone.Router,
    path: '/provisionar',
  },
  {
    name: 'Clientes',
    icon: duotone.UserGroup,
    path: '/clientes',
  },
  {
    name: 'Gerenciar OLTs',
    icon: duotone.DeviceHub,
    path: '/olts',
  },
];

export default navigations;
