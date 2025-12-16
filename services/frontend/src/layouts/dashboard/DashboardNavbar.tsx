import {
  AppBar,
  Box,
  IconButton,
  styled,
  Theme,
  Toolbar,
  useMediaQuery,
} from '@mui/material';
import { Menu as MenuIcon } from '@mui/icons-material';
import { H2 } from '@shared/ui/components';
import { TitleContext } from '@shared/lib/contexts';
import { FC, useContext } from 'react';
import LanguagePopover from './popovers/LanguagePopover';
import NotificationsPopover from './popovers/NotificationsPopover';
import ProfilePopover from './popovers/ProfilePopover';
import ServicePopover from './popovers/ServicePopover';

// root component interface
interface DashboardNavBarProps {
  setShowMobileSideBar: () => void;
}

// custom styled components
const DashboardNavbarRoot = styled(AppBar)(({ theme }) => ({
  zIndex: 11,
  boxShadow: 'none',
  paddingTop: 0,
  paddingBottom: 0,
  backdropFilter: 'blur(6px)',
  backgroundColor: '#ffffff',
  borderBottom: `1px solid ${theme.palette.divider}`,
  color: theme.palette.text.primary,
  borderRadius: 0,
}));

const StyledToolBar = styled(Toolbar)(() => ({
  minHeight: 64,
  paddingLeft: 24,
  paddingRight: 24,
  '@media (min-width: 0px)': {
    paddingLeft: 24,
    paddingRight: 24,
    minHeight: 64,
  },
}));

// Styled components para o botão do menu
const MenuButton = styled(IconButton)(({ theme }) => ({
  marginRight: theme.spacing(2),
  color: theme.palette.text.primary,
  '&:hover': {
    backgroundColor: theme.palette.action.hover,
  },
}));

// root component
const DashboardNavbar: FC<DashboardNavBarProps> = ({
  setShowMobileSideBar,
}) => {
  const { title } = useContext(TitleContext);
  const upSm = useMediaQuery((theme: Theme) => theme.breakpoints.up('sm'));
  const downSm = useMediaQuery((theme: Theme) => theme.breakpoints.down('sm'));

  if (downSm) {
    return (
      <DashboardNavbarRoot position="sticky">
        <StyledToolBar>
          <MenuButton onClick={setShowMobileSideBar}>
            <MenuIcon />
          </MenuButton>

          <Box flexGrow={1} textAlign="center">
            <img
              src="/static/logo/logo.svg"
              width="100%"
              height="30"
              alt="Logo"
            />
          </Box>

          <LanguagePopover />
          <ProfilePopover />
        </StyledToolBar>
      </DashboardNavbarRoot>
    );
  }

  return (
    <DashboardNavbarRoot position="sticky">
      <StyledToolBar>
        <MenuButton onClick={setShowMobileSideBar}>
          <MenuIcon />
        </MenuButton>

        <H2
          fontSize={21}
          lineHeight={0}
          mx={1}
          fontWeight="700"
          color="text.primary"
        >
          {title}
        </H2>

        <Box flexGrow={1} ml={1} />

        {upSm && (
          <>
            <LanguagePopover />
            <NotificationsPopover />
            <ServicePopover />
          </>
        )}
        <ProfilePopover />
      </StyledToolBar>
    </DashboardNavbarRoot>
  );
};

export default DashboardNavbar;
