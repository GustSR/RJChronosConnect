import { AuthGuard, GuestGuard } from '@shared/ui/authentication';
import DashboardLayout from '@/layouts/dashboard/DashboardLayout';
import { LoadingScreen } from '@shared/ui';
import { FC, lazy, LazyExoticComponent, Suspense } from 'react';
import { Navigate } from 'react-router-dom';

const Loadable =
  (Component: LazyExoticComponent<FC>) => (props: Record<string, unknown>) =>
    (
      <Suspense fallback={<LoadingScreen />}>
        <Component {...props} />
      </Suspense>
    );

// authentication pages
const Login = Loadable(lazy(() => import('../pages/authentication/Login')));
const Register = Loadable(
  lazy(() => import('../pages/authentication/Register'))
);
const ForgetPassword = Loadable(
  lazy(() => import('../pages/authentication/ForgetPassword'))
);

// Dashboard pages
const Dashboard = Loadable(lazy(() => import('../pages/Dashboard')));

// Kanban page
const Kanban = Loadable(lazy(() => import('../pages/Kanban')));

// Provisioning page
const Provisioning = Loadable(lazy(() => import('../pages/Provisioning')));

// Clientes pages
const Clientes = Loadable(lazy(() => import('../pages/Clientes')));
const ClienteDetalhes = Loadable(
  lazy(() => import('../pages/ClienteDetalhes'))
);

// ONU Configuration pages
const ONUConfiguration = Loadable(
  lazy(() => import('../pages/ONUConfigurationNew'))
);
const ONUConfigurationStatus = Loadable(
  lazy(() => import('../pages/ONUConfigurationStatus'))
);

// OLT Management pages
const OLTManagement = Loadable(lazy(() => import('../pages/OLTManagement')));
const OLTAdd = Loadable(lazy(() => import('../pages/OLTAdd')));
const OLTDetails = Loadable(lazy(() => import('../pages/OLTDetails')));

// user profile
const UserProfile = Loadable(lazy(() => import('../pages/UserProfile')));

// user management
const UserList = Loadable(
  lazy(() => import('../pages/userManagement/UserList'))
);
const UserGrid = Loadable(
  lazy(() => import('../pages/userManagement/UserGrid'))
);
const AddNewUser = Loadable(
  lazy(() => import('../pages/userManagement/AddNewUser'))
);

// error
const Error = Loadable(lazy(() => import('../pages/404')));

// routes
const routes = [
  {
    path: '/',
    element: <Navigate to="dashboard" />,
  },
  {
    path: 'login',
    element: (
      <GuestGuard>
        <Login />
      </GuestGuard>
    ),
  },
  {
    path: 'register',
    element: (
      <GuestGuard>
        <Register />
      </GuestGuard>
    ),
  },
  {
    path: 'forget-password',
    element: (
      <GuestGuard>
        <ForgetPassword />
      </GuestGuard>
    ),
  },
  {
    path: 'dashboard',
    element: (
      <AuthGuard>
        <DashboardLayout />
      </AuthGuard>
    ),
    children: [
      {
        path: '',
        element: <Dashboard />,
      },
      {
        path: 'kanban',
        element: <Kanban />,
      },
      {
        path: 'user-profile',
        element: <UserProfile />,
      },
      // User management routes
      {
        path: 'user-list',
        element: <UserList />,
      },
      {
        path: 'user-grid',
        element: <UserGrid />,
      },
      {
        path: 'add-user',
        element: <AddNewUser />,
      },
    ],
  },
  // Independent routes with DashboardLayout
  {
    path: 'provisionar',
    element: (
      <AuthGuard>
        <DashboardLayout />
      </AuthGuard>
    ),
    children: [
      {
        path: '',
        element: <Provisioning />,
      },
      {
        path: ':id',
        element: <ONUConfiguration />,
      },
      {
        path: ':id/status',
        element: <ONUConfigurationStatus />,
      },
    ],
  },
  {
    path: 'clientes',
    element: (
      <AuthGuard>
        <DashboardLayout />
      </AuthGuard>
    ),
    children: [
      {
        path: '',
        element: <Clientes />,
      },
      {
        path: ':id',
        element: <ClienteDetalhes />,
      },
      {
        path: ':id/configurar',
        element: <ONUConfiguration />,
      },
    ],
  },
  {
    path: 'olts',
    element: (
      <AuthGuard>
        <DashboardLayout />
      </AuthGuard>
    ),
    children: [
      {
        path: '',
        element: <OLTManagement />,
      },
      {
        path: 'add',
        element: <OLTAdd />,
      },
      {
        path: ':id',
        element: <OLTDetails />,
      },
    ],
  },
  {
    path: '*',
    element: <Error />,
  },
];

export default routes;
