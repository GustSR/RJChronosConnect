import {
  ChartLine,
  WifiHigh,
  Users,
  Desktop,
  House,
  Network,
} from '@phosphor-icons/react';

// Ícones duotone para nossa sidebar no estilo Uko
export const duotone = {
  // Dashboard
  Analytics: (props: any) => <ChartLine {...props} weight="duotone" />,
  Dashboard: (props: any) => <House {...props} weight="duotone" />,

  // Management
  Router: (props: any) => <WifiHigh {...props} weight="duotone" />,
  UserGroup: (props: any) => <Users {...props} weight="duotone" />,
  DeviceHub: (props: any) => <Desktop {...props} weight="duotone" />,
  Network: (props: any) => <Network {...props} weight="duotone" />,

  // Aliases para compatibilidade
  People: (props: any) => <Users {...props} weight="duotone" />,
  DeviceHubAlt: (props: any) => <Network {...props} weight="duotone" />,
};
