import React, { Fragment, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  styled,
  Box,
  Drawer,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Typography,
  Collapse,
  useMediaQuery,
  Theme,
} from '@mui/material';
import { ExpandLess, KeyboardArrowRight } from '@mui/icons-material';
import ScrollBar from 'simplebar-react';
import { H6 } from 'components/Typography';
import navigations from './topMenuList';

// root component interface
interface SideNavBarProps {
  showMobileSideBar: boolean;
  closeMobileSideBar: () => void;
  sidebarCollapsed?: boolean;
}

// Styled Components
const MainMenu = styled(Box, {
  shouldForwardProp: (prop) => prop !== 'collapsed',
})<{ collapsed?: boolean }>(({ theme, collapsed }) => ({
  left: 0,
  width: collapsed ? 80 : 280,
  height: '100vh',
  position: 'fixed',
  boxShadow: '0 0 28px 0 rgba(82,63,105,.05)',
  transition: 'width 0.3s ease',
  zIndex: theme.zIndex.drawer + 11,
  backgroundColor: '#fff',
  border: 'none',
  fontFamily: '"Public Sans", sans-serif',
  overflow: 'hidden',
  [theme.breakpoints.down('md')]: { left: -280 },
  '& .simplebar-track.simplebar-vertical': {
    width: 7,
    right: 0,
  },
  '& .simplebar-scrollbar:before': {
    background: '#e2e8f0',
    borderRadius: '4px',
  },
  '& .simplebar-content-wrapper': {
    height: '100%',
    overflow: 'auto',
  },
  '& .simplebar-content': {
    height: '100%',
  },
}));

const LogoBox = styled(Box)(() => ({
  display: 'flex',
  alignItems: 'center',
  padding: '24px 24px 16px 24px',
  marginBottom: 16,
}));

const LogoIcon = styled(Box)(() => ({
  width: 32,
  height: 32,
  backgroundColor: '#7c3aed',
  borderRadius: '8px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  marginRight: 12,
  color: 'white',
  fontSize: '18px',
  fontWeight: 600,
}));

const MenuSection = styled(Box)(() => ({
  marginBottom: 24,
}));

const SectionTitle = styled(Typography)(() => ({
  fontSize: '11px',
  fontWeight: 700,
  letterSpacing: '1px',
  textTransform: 'uppercase',
  color: '#64748B',
  padding: '0 24px',
  marginBottom: 12,
  fontFamily: '"Public Sans", sans-serif',
}));

const StyledListItemButton = styled(ListItemButton, {
  shouldForwardProp: (prop) => prop !== 'active' && prop !== 'hasChildren',
})<{ active?: boolean; hasChildren?: boolean }>(({ active }) => ({
  margin: '0 12px',
  borderRadius: '8px',
  padding: '12px 16px',
  minHeight: '48px',
  '&:hover': {
    backgroundColor: '#f8fafc',
  },
  ...(active && {
    backgroundColor: '#f1f5f9',
    '& .MuiListItemIcon-root': {
      color: '#7c3aed',
    },
    '& .MuiListItemText-primary': {
      color: '#1e293b',
      fontWeight: 600,
    },
  }),
  '& .MuiListItemIcon-root': {
    minWidth: 40,
    color: '#64748B',
  },
  '& .MuiListItemText-primary': {
    fontSize: '14px',
    fontWeight: 500,
    color: '#475569',
    fontFamily: '"Public Sans", sans-serif',
  },
}));

const SubMenuItem = styled(ListItemButton, {
  shouldForwardProp: (prop) => prop !== 'active',
})<{ active?: boolean }>(({ active }) => ({
  margin: '0 12px',
  borderRadius: '8px',
  padding: '8px 16px 8px 48px',
  minHeight: '40px',
  '&:hover': {
    backgroundColor: '#f8fafc',
  },
  ...(active && {
    backgroundColor: '#f1f5f9',
    '& .MuiListItemText-primary': {
      color: '#7c3aed',
      fontWeight: 600,
    },
    '& .dot-indicator': {
      backgroundColor: '#7c3aed',
    },
  }),
  '& .MuiListItemText-primary': {
    fontSize: '13px',
    fontWeight: 500,
    color: '#64748B',
    fontFamily: '"Public Sans", sans-serif',
  },
}));

const DotIndicator = styled(Box)(() => ({
  width: '6px',
  height: '6px',
  borderRadius: '50%',
  backgroundColor: '#cbd5e1',
  marginRight: '12px',
  flexShrink: 0,
}));

// root component
const DashboardSideBar: React.FC<SideNavBarProps> = ({
  showMobileSideBar,
  closeMobileSideBar,
  sidebarCollapsed = false,
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [expandedItems, setExpandedItems] = useState<string[]>(['analytics']);
  const downMd = useMediaQuery((theme: Theme) => theme.breakpoints.down('md'));

  const handleItemClick = (item: {
    title: string;
    children?: unknown[];
    path?: string;
    Icon: React.ComponentType;
  }) => {
    if (item.children && item.children.length > 0) {
      // Toggle expansion for parent items
      setExpandedItems((prev) =>
        prev.includes(item.title.toLowerCase())
          ? prev.filter((i) => i !== item.title.toLowerCase())
          : [...prev, item.title.toLowerCase()]
      );
    } else {
      // Navigate for items without children
      if (item.path) {
        navigate(item.path);
        closeMobileSideBar();
      }
    }
  };

  const handleSubItemClick = (subItem: { path?: string }) => {
    if (subItem.path) {
      navigate(subItem.path);
      closeMobileSideBar();
    }
  };

  const isActiveItem = (item: {
    path?: string;
    children?: { path?: string }[];
  }) => {
    if (item.path) {
      return location.pathname === item.path;
    }
    // Check if any child is active
    if (item.children) {
      return item.children.some(
        (child: { path?: string }) => location.pathname === child.path
      );
    }
    return false;
  };

  const isActiveSubItem = (subItem: { path?: string }) => {
    return location.pathname === subItem.path;
  };

  const renderMenuItem = (item: {
    title: string;
    children?: { title: string; path?: string }[];
    path?: string;
    Icon: React.ComponentType;
  }) => {
    const isExpanded = expandedItems.includes(item.title.toLowerCase());
    const hasChildren = item.children && item.children.length > 0;
    const active = isActiveItem(item);

    return (
      <Fragment key={item.title}>
        <StyledListItemButton
          active={active}
          hasChildren={hasChildren}
          onClick={() => handleItemClick(item)}
          title={sidebarCollapsed ? item.title : undefined}
        >
          <ListItemIcon>
            <item.Icon fontSize="small" />
          </ListItemIcon>
          {!sidebarCollapsed && (
            <>
              <ListItemText primary={item.title} />
              {hasChildren && (
                <Box sx={{ ml: 'auto' }}>
                  {isExpanded ? (
                    <ExpandLess fontSize="small" />
                  ) : (
                    <KeyboardArrowRight fontSize="small" />
                  )}
                </Box>
              )}
            </>
          )}
        </StyledListItemButton>

        {hasChildren && !sidebarCollapsed && (
          <Collapse in={isExpanded} timeout="auto" unmountOnExit>
            <List component="div" disablePadding>
              {item.children.map(
                (subItem: { title: string; path?: string }) => (
                  <SubMenuItem
                    key={subItem.title}
                    active={isActiveSubItem(subItem)}
                    onClick={() => handleSubItemClick(subItem)}
                  >
                    <Box
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        width: '100%',
                      }}
                    >
                      <DotIndicator className="dot-indicator" />
                      <ListItemText primary={subItem.title} />
                    </Box>
                  </SubMenuItem>
                )
              )}
            </List>
          </Collapse>
        )}
      </Fragment>
    );
  };

  const groupItemsByCategory = () => {
    const groups: {
      [key: string]: {
        title: string;
        category: string;
        children?: unknown[];
        path?: string;
        Icon: React.ComponentType;
      }[];
    } = {};
    navigations.forEach((item) => {
      if (!groups[item.category]) {
        groups[item.category] = [];
      }
      groups[item.category].push(item);
    });
    return groups;
  };

  const getCategoryTitle = (category: string) => {
    switch (category) {
      case 'dashboard':
        return 'DASHBOARD';
      case 'management':
        return 'MANAGEMENT';
      case 'apps':
        return 'APPS';
      case 'others':
        return 'OTHERS';
      default:
        return category.toUpperCase();
    }
  };

  const groupedItems = groupItemsByCategory();

  const sidebarContent = (
    <Box
      sx={{
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
      <LogoBox>
        <LogoIcon>U</LogoIcon>
        {!sidebarCollapsed && (
          <H6 fontSize={18} fontWeight={600} color="#1e293b">
            UKO
          </H6>
        )}
      </LogoBox>

      <ScrollBar style={{ flexGrow: 1, height: 'calc(100vh - 120px)' }}>
        <List sx={{ padding: '0 0 24px 0' }}>
          {Object.entries(groupedItems).map(([category, items]) => (
            <MenuSection key={category}>
              {!sidebarCollapsed && (
                <SectionTitle>{getCategoryTitle(category)}</SectionTitle>
              )}
              {items.map(renderMenuItem)}
            </MenuSection>
          ))}
        </List>
      </ScrollBar>
    </Box>
  );

  // for mobile device
  if (downMd) {
    return (
      <Drawer
        anchor="left"
        open={showMobileSideBar}
        onClose={closeMobileSideBar}
        PaperProps={{
          sx: {
            width: 280,
            backgroundColor: '#fff',
            border: 'none',
            boxShadow: '0 0 28px 0 rgba(82,63,105,.05)',
            fontFamily: '"Public Sans", sans-serif',
          },
        }}
      >
        {sidebarContent}
      </Drawer>
    );
  }

  return <MainMenu collapsed={sidebarCollapsed}>{sidebarContent}</MainMenu>;
};

export default DashboardSideBar;
