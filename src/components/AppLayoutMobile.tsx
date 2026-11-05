import { ReactNode, useState } from 'react';
import { AppBar as AppBarMui, Fab } from '@mui/material';
import { styled } from '@mui/material/styles';
import Box from '@mui/material/Box';
import BottomNavigation from '@mui/material/BottomNavigation';
import BottomNavigationAction from '@mui/material/BottomNavigationAction';
import QueryStatsIcon from '@mui/icons-material/QueryStatsOutlined';
import AddRoundedIcon from '@mui/icons-material/AddRounded';
import SettingsRoundedIcon from '@mui/icons-material/SettingsRounded';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import { useRouter } from 'next/router';
import { AddInvoiceModal } from './ModalAddInvoice';
import { AppBar } from './AppTopBar';
import { OfflineSyncStatus } from './OfflineSyncStatus';

type Route = '/' | '/expenses' | '/revenues' | '/settings';

type Props = {
  children: ReactNode;
  tabSelected: Route | undefined;
};

const navigationItems = [
  { path: '/', label: 'Home', icon: <QueryStatsIcon /> },
  { path: '/expenses', label: 'Despesas', icon: <TrendingDownIcon /> },
  { path: '/revenues', label: 'Receitas', icon: <TrendingUpIcon /> },
  { path: '/settings', label: 'Configurações', icon: <SettingsRoundedIcon /> },
] as const;

export const LayoutMobile = ({ children, tabSelected }: Props) => {
  const router = useRouter();
  const [openAddInvoiceModal, setOpenAddInvoiceModal] = useState(false);

  const navigateWithCurrentQuery = (pathname: Route) => {
    router.push({ pathname, query: router.query });
  };

  return (
    <Box>
      <AppBar />
      <Box component='main' sx={{ mt: 10, mb: 'calc(152px + env(safe-area-inset-bottom, 0px))' }} width='100%'>
        <OfflineSyncStatus />
        {children}
      </Box>
      <AppBarMui
        position='fixed'
        color='primary'
        sx={{
          top: 'auto', bottom: 0,
          pb: 'env(safe-area-inset-bottom, 0px)',
          background: 'var(--nav)',
          color: 'var(--nav-text)',
          borderTop: '1px solid rgba(213, 248, 255, 0.24)',
          boxShadow: 'var(--shadow)',
        }}
      >
        <BottomNavigation
          component='nav' aria-label='Navegação principal' showLabels
          value={tabSelected ?? false}
          onChange={(_event, pathname: Route) => navigateWithCurrentQuery(pathname)}
          sx={{
            height: 64, px: 0.7, backgroundColor: 'transparent',
            '& .MuiBottomNavigationAction-root': {
              minWidth: 0, maxWidth: 'none', flex: 1, px: { xs: 0.25, sm: 1 },
              color: 'var(--nav-muted)', borderRadius: 2,
              transition: 'color .2s ease, background-color .2s ease',
              '& .MuiSvgIcon-root': { fontSize: 22 },
              '& .MuiBottomNavigationAction-label': { fontSize: { xs: 11, sm: 12 }, fontWeight: 500, mt: 0.4 },
              '&.Mui-selected': {
                color: 'var(--nav-text)', backgroundColor: 'var(--nav-selected)',
                boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.2)',
                '& .MuiBottomNavigationAction-label': { fontSize: { xs: 11, sm: 12 }, fontWeight: 600 },
              },
            },
          }}
        >
          {navigationItems.map(item => (
            <BottomNavigationAction
              key={item.path} value={item.path} label={item.label} icon={item.icon}
              aria-current={tabSelected === item.path ? 'page' : undefined}
            />
          ))}
        </BottomNavigation>
      </AppBarMui>
      <LaunchFab color='primary' onClick={() => setOpenAddInvoiceModal(true)} aria-label='Lançar despesa ou receita' aria-haspopup='dialog'>
        <AddRoundedIcon sx={{ fontSize: 30 }} />
      </LaunchFab>
      <AddInvoiceModal open={openAddInvoiceModal} handleClose={() => setOpenAddInvoiceModal(false)} />
    </Box>
  );
};

const LaunchFab = styled(Fab)(({ theme }) => ({
  position: 'fixed',
  zIndex: theme.zIndex.appBar + 1,
  right: 'max(20px, env(safe-area-inset-right, 0px))',
  bottom: 'calc(84px + env(safe-area-inset-bottom, 0px))',
  width: 56, height: 56,
  color: 'var(--action-text)',
  background: 'var(--fab)',
  '&:hover': { background: 'var(--fab-hover)' },
  boxShadow: 'var(--shadow)',
  '&::before': {
    content: '""', position: 'absolute', inset: 0, borderRadius: '50%', pointerEvents: 'none',
    border: `2px solid ${theme.palette.primary.main}`,
    animation: 'launchPulse 2.8s ease-out infinite',
  },
  '&:hover::before, &:focus-visible::before': { animation: 'none', opacity: 0 },
  '@keyframes launchPulse': {
    '0%': { transform: 'scale(1)', opacity: 0.35 },
    '70%, 100%': { transform: 'scale(1.55)', opacity: 0 },
  },
  '@media (prefers-reduced-motion: reduce)': {
    '&::before': { animation: 'none', opacity: 0 },
  },
}));
