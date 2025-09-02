import AuthGuard from 'components/authentication/AuthGuard';
import GuestGuard from 'components/authentication/GuestGuard';
import DashboardLayout from 'components/Layouts/DashboardLayout';
import LoadingScreen from 'components/LoadingScreen';
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
const Login = Loadable(lazy(() => import('./pages/authentication/Login')));
const Register = Loadable(
  lazy(() => import('./pages/authentication/Register'))
);
const ForgetPassword = Loadable(
  lazy(() => import('./pages/authentication/ForgetPassword'))
);

// Dashboard pages
const Dashboard = Loadable(lazy(() => import('./pages/Dashboard')));

// Kanban page
const Kanban = Loadable(lazy(() => import('./pages/Kanban')));

// Provisioning page
const Provisioning = Loadable(lazy(() => import('./pages/Provisioning')));

// Clientes page
const Clientes = Loadable(lazy(() => import('./pages/Clientes')));

// ONU Configuration pages
const ONUConfiguration = Loadable(
  lazy(() => import('./pages/ONUConfigurationNew'))
);
const ONUConfigurationStatus = Loadable(
  lazy(() => import('./pages/ONUConfigurationStatus'))
);

// user profile
const UserProfile = Loadable(lazy(() => import('./pages/UserProfile')));

// user management
const UserList = Loadable(
  lazy(() => import('./pages/userManagement/UserList'))
);
const UserGrid = Loadable(
  lazy(() => import('./pages/userManagement/UserGrid'))
);
const AddNewUser = Loadable(
  lazy(() => import('./pages/userManagement/AddNewUser'))
);

// error
const Error = Loadable(lazy(() => import('./pages/404')));

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
        path: 'provisionar',
        element: <Provisioning />,
      },
      {
        path: 'clientes',
        element: <Clientes />,
      },
      {
        path: 'clientes/:id/configurar',
        element: <ONUConfiguration />,
      },
      {
        path: 'provisionar/:id',
        element: <ONUConfiguration />,
      },
      {
        path: 'provisionar/:id/status',
        element: <ONUConfigurationStatus />,
      },
      {
        path: 'user-profile',
        element: <UserProfile />,
      },

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
  {
    path: '*',
    element: <Error />,
  },
];

export default routes;
