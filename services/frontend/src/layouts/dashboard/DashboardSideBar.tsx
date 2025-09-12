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
  Tooltip,
  Zoom,
} from '@mui/material';
import { ExpandLess, KeyboardArrowRight } from '@mui/icons-material';
import ScrollBar from 'simplebar-react';
import { H6 } from '@shared/ui/components';
import navigations from './topMenuList';

// root component interface
interface SideNavBarProps {
  showMobileSideBar: boolean;
  closeMobileSideBar: () => void;
  sidebarCollapsed?: boolean;
}

// Styled Components - Estilo Uko
const MainMenu = styled(Box, {
  shouldForwardProp: (prop) => prop !== 'collapsed',
})<{ collapsed?: boolean }>(({ theme, collapsed }) => ({
  left: 0,
  width: collapsed ? 80 : 280,
  height: '100vh',
  position: 'fixed',
  boxShadow:
    theme.palette.mode === 'light'
      ? '0 8px 45px rgba(3, 0, 71, 0.09)'
      : '0 8px 45px rgba(0, 0, 0, 0.4)',
  transition: 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
  zIndex: theme.zIndex.drawer + 11,
  backgroundColor: theme.palette.mode === 'light' ? '#ffffff' : '#1e2028',
  borderRight: `1px solid ${
    theme.palette.mode === 'light' ? '#f1f5f9' : '#2d3035'
  }`,
  fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, sans-serif',
  overflow: 'hidden',
  [theme.breakpoints.down('md')]: { left: -280 },
  '& .simplebar-track.simplebar-vertical': {
    width: 6,
    right: 4,
    opacity: 0,
    transition: 'opacity 0.2s ease',
  },
  '&:hover .simplebar-track.simplebar-vertical': {
    opacity: 1,
  },
  '& .simplebar-scrollbar:before': {
    background:
      theme.palette.mode === 'light'
        ? 'rgba(0, 0, 0, 0.1)'
        : 'rgba(255, 255, 255, 0.2)',
    borderRadius: '3px',
  },
  '& .simplebar-content-wrapper': {
    height: '100%',
    overflow: 'auto',
  },
  '& .simplebar-content': {
    height: '100%',
    paddingRight: '8px',
  },
}));

const LogoBox = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  padding: '28px 24px 24px 24px',
  marginBottom: 20,
  borderBottom: `1px solid ${
    theme.palette.mode === 'light' ? '#f1f5f9' : '#2d3035'
  }`,
  position: 'relative',
  '&::after': {
    content: '""',
    position: 'absolute',
    bottom: 0,
    left: 24,
    right: 24,
    height: '1px',
    background: `linear-gradient(90deg, ${theme.palette.primary.main}20, transparent)`,
  },
}));

const LogoIcon = styled(Box)(({ theme }) => ({
  width: 40,
  height: 40,
  background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.primary.dark})`,
  borderRadius: '12px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  marginRight: 12,
  color: 'white',
  fontSize: '20px',
  fontWeight: 700,
  boxShadow:
    theme.palette.mode === 'light'
      ? `0 4px 20px ${theme.palette.primary.main}25`
      : `0 4px 20px ${theme.palette.primary.main}40`,
  transition: 'all 0.3s ease',
  '&:hover': {
    transform: 'translateY(-2px)',
    boxShadow:
      theme.palette.mode === 'light'
        ? `0 8px 25px ${theme.palette.primary.main}35`
        : `0 8px 25px ${theme.palette.primary.main}50`,
  },
}));

const MenuSection = styled(Box)(() => ({
  marginBottom: 32,
}));

const SectionTitle = styled(Typography)(({ theme }) => ({
  fontSize: '11px',
  fontWeight: 800,
  letterSpacing: '1.2px',
  textTransform: 'uppercase',
  color: theme.palette.mode === 'light' ? '#6b7280' : '#9ca3af',
  padding: '0 24px',
  marginBottom: 16,
  fontFamily: '"Inter", sans-serif',
  position: 'relative',
  '&::after': {
    content: '""',
    position: 'absolute',
    bottom: -8,
    left: 24,
    width: 24,
    height: '2px',
    background: `linear-gradient(90deg, ${theme.palette.primary.main}, transparent)`,
    borderRadius: '1px',
  },
}));

const StyledListItemButton = styled(ListItemButton, {
  shouldForwardProp: (prop) => prop !== 'active' && prop !== 'hasChildren',
})<{ active?: boolean; hasChildren?: boolean }>(({ theme, active }) => ({
  margin: '0 16px',
  borderRadius: '12px',
  padding: '14px 16px',
  minHeight: '52px',
  position: 'relative',
  transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
  cursor: 'pointer',
  '&::before': {
    content: '""',
    position: 'absolute',
    left: -16,
    top: '50%',
    transform: 'translateY(-50%)',
    width: '4px',
    height: active ? '60%' : '0%',
    backgroundColor: theme.palette.primary.main,
    borderRadius: '0 4px 4px 0',
    transition: 'height 0.3s ease',
  },
  '&:hover': {
    backgroundColor: theme.palette.mode === 'light' ? '#f8fafc' : '#2a2d35',
    transform: 'translateX(4px)',
    '& .MuiListItemIcon-root': {
      transform: 'scale(1.1)',
      color: theme.palette.primary.main,
    },
    '&::before': {
      height: '40%',
    },
  },
  ...(active && {
    backgroundColor:
      theme.palette.mode === 'light'
        ? `${theme.palette.primary.main}08`
        : `${theme.palette.primary.main}15`,
    color: theme.palette.primary.main,
    '&::before': {
      height: '60%',
    },
    '& .MuiListItemIcon-root': {
      color: theme.palette.primary.main,
      transform: 'scale(1.05)',
    },
    '& .MuiListItemText-primary': {
      color:
        theme.palette.mode === 'light'
          ? theme.palette.primary.main
          : theme.palette.primary.light,
      fontWeight: 600,
    },
  }),
  '& .MuiListItemIcon-root': {
    minWidth: 44,
    color: theme.palette.mode === 'light' ? '#6b7280' : '#9ca3af',
    transition: 'all 0.2s ease',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  '& .MuiListItemText-primary': {
    fontSize: '14px',
    fontWeight: 500,
    color: theme.palette.mode === 'light' ? '#374151' : '#d1d5db',
    fontFamily: '"Inter", sans-serif',
    transition: 'all 0.2s ease',
  },
}));

const SubMenuItem = styled(ListItemButton, {
  shouldForwardProp: (prop) => prop !== 'active',
})<{ active?: boolean }>(({ theme, active }) => ({
  margin: '0 16px',
  borderRadius: '10px',
  padding: '10px 16px 10px 52px',
  minHeight: '44px',
  position: 'relative',
  transition: 'all 0.2s ease',
  '&::before': {
    content: '""',
    position: 'absolute',
    left: 32,
    top: '50%',
    transform: 'translateY(-50%)',
    width: '2px',
    height: active ? '70%' : '0%',
    backgroundColor: theme.palette.primary.main,
    borderRadius: '1px',
    transition: 'height 0.2s ease',
  },
  '&:hover': {
    backgroundColor: theme.palette.mode === 'light' ? '#f8fafc' : '#2a2d35',
    transform: 'translateX(6px)',
    '&::before': {
      height: '50%',
    },
    '& .dot-indicator': {
      backgroundColor: theme.palette.primary.main,
      transform: 'scale(1.2)',
    },
  },
  ...(active && {
    backgroundColor:
      theme.palette.mode === 'light'
        ? `${theme.palette.primary.main}06`
        : `${theme.palette.primary.main}12`,
    '&::before': {
      height: '70%',
    },
    '& .MuiListItemText-primary': {
      color: theme.palette.primary.main,
      fontWeight: 600,
    },
    '& .dot-indicator': {
      backgroundColor: theme.palette.primary.main,
      boxShadow: `0 0 8px ${theme.palette.primary.main}40`,
    },
  }),
  '& .MuiListItemText-primary': {
    fontSize: '13px',
    fontWeight: 500,
    color: theme.palette.mode === 'light' ? '#6b7280' : '#9ca3af',
    fontFamily: '"Inter", sans-serif',
    transition: 'all 0.2s ease',
  },
}));

const DotIndicator = styled(Box)(({ theme }) => ({
  width: '8px',
  height: '8px',
  borderRadius: '50%',
  backgroundColor: theme.palette.mode === 'light' ? '#d1d5db' : '#6b7280',
  marginRight: '14px',
  flexShrink: 0,
  transition: 'all 0.2s ease',
  position: 'relative',
  '&::after': {
    content: '""',
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    width: '16px',
    height: '16px',
    border: `2px solid transparent`,
    borderRadius: '50%',
    transition: 'border-color 0.2s ease',
  },
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
    name: string;
    children?: unknown[];
    path?: string;
    icon: React.ComponentType;
  }) => {
    if (item.children && item.children.length > 0) {
      // Toggle expansion for parent items
      setExpandedItems((prev) =>
        prev.includes(item.name.toLowerCase())
          ? prev.filter((i) => i !== item.name.toLowerCase())
          : [...prev, item.name.toLowerCase()]
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
    name: string;
    children?: { name: string; path?: string }[];
    path?: string;
    icon: React.ComponentType;
  }) => {
    const isExpanded = expandedItems.includes(item.name.toLowerCase());
    const hasChildren = item.children && item.children.length > 0;
    const active = isActiveItem(item);

    const menuItem = (
      <StyledListItemButton
        active={active}
        hasChildren={hasChildren}
        onClick={() => handleItemClick(item)}
      >
        <ListItemIcon>
          <item.icon size={20} />
        </ListItemIcon>
        {!sidebarCollapsed && (
          <>
            <ListItemText primary={item.name} />
            {hasChildren && (
              <Box sx={{ ml: 'auto', transition: 'transform 0.2s ease' }}>
                {isExpanded ? (
                  <ExpandLess
                    fontSize="small"
                    sx={{
                      transform: 'rotate(0deg)',
                      transition: 'transform 0.2s ease',
                    }}
                  />
                ) : (
                  <KeyboardArrowRight
                    fontSize="small"
                    sx={{
                      transform: 'rotate(0deg)',
                      transition: 'transform 0.2s ease',
                    }}
                  />
                )}
              </Box>
            )}
          </>
        )}
      </StyledListItemButton>
    );

    return (
      <Fragment key={item.name}>
        {sidebarCollapsed ? (
          <Tooltip
            title={item.name}
            placement="right"
            TransitionComponent={Zoom}
            slotProps={{
              popper: {
                modifiers: [
                  {
                    name: 'offset',
                    options: {
                      offset: [0, -8],
                    },
                  },
                ],
              },
              tooltip: {
                sx: {
                  bgcolor: 'background.paper',
                  color: 'text.primary',
                  border: '1px solid',
                  borderColor: 'divider',
                  boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
                  fontSize: '12px',
                  fontWeight: 500,
                  borderRadius: '8px',
                  px: 1.5,
                  py: 1,
                },
              },
            }}
          >
            <Box>{menuItem}</Box>
          </Tooltip>
        ) : (
          menuItem
        )}

        {hasChildren && !sidebarCollapsed && (
          <Collapse in={isExpanded} timeout="auto" unmountOnExit>
            <List component="div" disablePadding>
              {item.children.map((subItem: { name: string; path?: string }) => (
                <SubMenuItem
                  key={subItem.name}
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
                    <ListItemText primary={subItem.name} />
                  </Box>
                </SubMenuItem>
              ))}
            </List>
          </Collapse>
        )}
      </Fragment>
    );
  };

  // Processar navegações no formato Uko
  const processNavigations = () => {
    const sections: {
      label?: string;
      items: {
        name: string;
        children?: { name: string; path?: string }[];
        path?: string;
        icon: React.ComponentType;
      }[];
    }[] = [];

    let currentSection: {
      label?: string;
      items: {
        name: string;
        children?: { name: string; path?: string }[];
        path?: string;
        icon: React.ComponentType;
      }[];
    } = { items: [] };

    navigations.forEach((item) => {
      if (item.type === 'label') {
        // Se já temos items na seção atual, adiciona ela ao array
        if (currentSection.items.length > 0) {
          sections.push(currentSection);
        }
        // Inicia nova seção
        currentSection = { label: item.name, items: [] };
      } else {
        // Adiciona item à seção atual
        currentSection.items.push(item as any);
      }
    });

    // Adiciona última seção se tiver items
    if (currentSection.items.length > 0) {
      sections.push(currentSection);
    }

    return sections;
  };

  const processedSections = processNavigations();

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
        <LogoIcon>RJ</LogoIcon>
        {!sidebarCollapsed && (
          <H6 fontSize={18} fontWeight={600} color="#1e293b">
            RJ Chronos
          </H6>
        )}
      </LogoBox>

      <ScrollBar style={{ flexGrow: 1, height: 'calc(100vh - 120px)' }}>
        <List sx={{ padding: '0 0 24px 0' }}>
          {processedSections.map((section, sectionIndex) => (
            <MenuSection key={section.label || sectionIndex}>
              {!sidebarCollapsed && section.label && (
                <SectionTitle>{section.label}</SectionTitle>
              )}
              {section.items.map(renderMenuItem)}
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
