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
    <AppBarMui position="fixed" color='primary' sx={{ top: 'auto', bottom: 0 }}>
      <StyledFab color='secondary' onClick={handleOpenModal} aria-label="add">
        <ExposureIcon color='primary' />
      </StyledFab>
      <BottomNavigation
        showLabels
        value={tabSelectedIndex}
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
        <BottomNavigationAction label="Home" icon={<QueryStatsIcon />} />
        <BottomNavigationAction disabled label="" />
        <BottomNavigationAction label="Despesas" icon={<TrendingDownIcon color='error' />} />
        <BottomNavigationAction label="Receitas" icon={<TrendingUpIcon color='success' />} />
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
});
