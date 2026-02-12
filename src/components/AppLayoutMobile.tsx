import { ReactNode, useState, useMemo } from "react"
import { Fab } from '@mui/material'
import { styled } from '@mui/material/styles';
import Box from "@mui/material/Box";
import BottomNavigation from '@mui/material/BottomNavigation';
import BottomNavigationAction from '@mui/material/BottomNavigationAction';
import QueryStatsIcon from '@mui/icons-material/QueryStatsOutlined';
import { useRouter } from "next/router";
import { AddInvoiceModal } from "./ModalAddInvoice";
import { AppBar } from "./AppTopBar";
import { AppBar as AppBarMui } from '@mui/material';
import ExposureIcon from '@mui/icons-material/Exposure';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';

type Props = {
  children: ReactNode;
  tabSelected: '/' | '/expenses' | '/revenues' | undefined;
}

export const LayoutMobile = ({ children, tabSelected }: Props) => {
  const router = useRouter()

  const tabSelectedIndex = useMemo(() => {
    switch (tabSelected) {
      case '/':
        return 0;
      case '/expenses':
        return 2;
      case '/revenues':
        return 3;
      default:
        return undefined;
    }
  }, [tabSelected])

  const [openAddInvoiceModal, setOpenAddInvoiceModal] = useState(false);
  const handleCloseModal = () => setOpenAddInvoiceModal(false);
  const handleOpenModal = () => setOpenAddInvoiceModal(true);

  const navigateWithCurrentQuery = (pathname: string) => {
    router.push({
      pathname,
      query: router.query
    });
  };

  return <Box>
    <AppBar />
    <Box component='main' sx={{ mt: 10, mb: 15 }} width='100%'>
      {children}
    </Box>
    <AppBarMui
      position="fixed"
      color='primary'
      sx={{
        top: 'auto',
        bottom: 0,
        background: 'linear-gradient(136deg, #082b43 0%, #0f6a72 48%, #15917c 100%)',
        borderTop: '1px solid rgba(213, 248, 255, 0.24)',
        boxShadow: '0 -14px 30px -20px rgba(3, 35, 56, 0.8)',
        backdropFilter: 'blur(10px)',
      }}
    >
      <StyledFab onClick={handleOpenModal} aria-label="add">
        <ExposureIcon sx={{ color: '#dffcff' }} />
      </StyledFab>
      <BottomNavigation
        showLabels
        value={tabSelectedIndex}
        sx={{
          minHeight: 58,
          px: 0.7,
          backgroundColor: 'transparent',
          '& .MuiBottomNavigationAction-root': {
            minWidth: 68,
            maxWidth: 168,
            color: 'rgba(223, 252, 255, 0.8)',
            borderRadius: 2,
            transition: 'all .22s ease',
            '& .MuiBottomNavigationAction-label': {
              fontSize: 12,
              fontWeight: 600,
              letterSpacing: '.02em',
            },
          },
          '& .MuiBottomNavigationAction-root.Mui-selected': {
            color: '#ecfdff',
            backgroundColor: 'rgba(232, 252, 255, 0.16)',
            boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.2)',
            '& .MuiBottomNavigationAction-label': {
              fontSize: 12,
            },
          },
        }}
        onChange={(event, newValue) => {
          switch (newValue) {
            case 0:
              navigateWithCurrentQuery('/');
              break;
            case 2:
              navigateWithCurrentQuery('/expenses');
              break;
            case 3:
              navigateWithCurrentQuery('/revenues');
              break;
          }
        }}
      >
        <BottomNavigationAction label="Home" icon={<QueryStatsIcon sx={{ fontSize: 21 }} />} />
        <BottomNavigationAction
          disabled
          label=""
          sx={{
            opacity: 0,
            pointerEvents: 'none',
            '&.Mui-disabled': { opacity: 0 },
          }}
        />
        <BottomNavigationAction label="Despesas" icon={<TrendingDownIcon sx={{ fontSize: 21 }} />} />
        <BottomNavigationAction label="Receitas" icon={<TrendingUpIcon sx={{ fontSize: 21 }} />} />
      </BottomNavigation>
    </AppBarMui>
    <AddInvoiceModal open={openAddInvoiceModal} handleClose={handleCloseModal} />
  </Box >
};

const StyledFab = styled(Fab)({
  position: 'absolute',
  zIndex: 1,
  top: -30,
  left: 0,
  right: 100,
  margin: '0 auto',
  color: '#dffcff',
  background: 'linear-gradient(136deg, #082b43 0%, #0f6a72 48%, #15917c 100%)',
  border: '1px solid rgba(213, 248, 255, 0.3)',
  boxShadow: '0 16px 26px -18px rgba(3, 35, 56, 0.8)',
  '&:hover': {
    background: 'linear-gradient(136deg, #0a3451 0%, #12747c 48%, #1aa188 100%)',
  },
});
