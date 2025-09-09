import { Box, styled } from '@mui/material';
import { FC, Fragment, ReactNode, useState } from 'react';
import { Outlet } from 'react-router-dom';
import DashboardNavbar from './DashboardNavbar';
import DashboardSidebar from './DashboardSideBar';

// interface for component props
interface DashboardLayoutProps {
  children?: ReactNode;
}

// styled components
const Wrapper = styled(Box, {
  shouldForwardProp: (prop) => prop !== 'sidebarCollapsed',
})<{ sidebarCollapsed: boolean }>(({ theme, sidebarCollapsed }) => ({
  width: sidebarCollapsed ? `calc(100% - 80px)` : `calc(100% - 280px)`,
  marginLeft: sidebarCollapsed ? 80 : 280,
  padding: '0 2rem',
  minHeight: '100vh',
  backgroundColor: theme.palette.grey[50],
  transition: 'margin-left 0.3s ease, width 0.3s ease',
  [theme.breakpoints.down('md')]: {
    width: '100%',
    marginLeft: 0,
    paddingLeft: '2rem',
    paddingRight: '2rem',
  },
}));

const DashboardLayout: FC<DashboardLayoutProps> = ({ children }) => {
  const [showMobileSideBar, setShowMobileSideBar] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const toggleSidebar = () => {
    // Em mobile, controla o drawer
    if (window.innerWidth < 960) {
      setShowMobileSideBar((state) => !state);
    } else {
      // Em desktop, colapsa/expande a sidebar
      setSidebarCollapsed((state) => !state);
    }
  };

  return (
    <Fragment>
      <DashboardSidebar
        showMobileSideBar={showMobileSideBar}
        closeMobileSideBar={() => setShowMobileSideBar(false)}
        sidebarCollapsed={sidebarCollapsed}
      />

      <Wrapper sidebarCollapsed={sidebarCollapsed}>
        <DashboardNavbar setShowMobileSideBar={toggleSidebar} />
        {children || <Outlet />}
      </Wrapper>
    </Fragment>
  );
};

export default DashboardLayout;
