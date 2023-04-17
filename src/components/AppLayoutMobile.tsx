import { ReactNode, useState, useMemo } from "react"
import { Fab } from '@mui/material'
import { styled } from '@mui/material/styles';
import AddIcon from '@mui/icons-material/Add';
import Box from "@mui/material/Box";
import BottomNavigation from '@mui/material/BottomNavigation';
import BottomNavigationAction from '@mui/material/BottomNavigationAction';
import AssignmentIcon from '@mui/icons-material/AssignmentOutlined';
import QueryStatsIcon from '@mui/icons-material/QueryStatsOutlined';
import { useRouter } from "next/router";
import { AddInvoiceModal } from "./ModalAddInvoice";
import { AppBar } from "./AppTopBar";
import { AppBar as AppBarMui } from '@mui/material';
import ExposureIcon from '@mui/icons-material/Exposure';

type Props = {
  children: ReactNode;
  tabSelected: '/' | '/expenses' | undefined;
}

export const LayoutMobile = ({ children, tabSelected }: Props) => {
  const router = useRouter()

  const tabSelectedIndex = useMemo(() => {
    switch (tabSelected) {
      case '/':
        return 0;
      case '/expenses':
        return 1;
      default:
        return undefined;
    }
  }, [tabSelected])

  const [openAddInvoiceModal, setOpenAddInvoiceModal] = useState(false);
  const handleCloseModal = () => setOpenAddInvoiceModal(false);
  const handleOpenModal = () => setOpenAddInvoiceModal(true);

  return <Box>
    <AppBar />
    <Box component='main' sx={{ mt: 10, mb: 15 }} width='100%'>
      {children}
    </Box>
    <AppBarMui position="fixed" color='primary' sx={{ top: 'auto', bottom: 0 }}>
      <StyledFab  color='secondary' onClick={handleOpenModal} aria-label="add">
        <ExposureIcon color='primary' />
      </StyledFab>
      <BottomNavigation
        showLabels
        value={tabSelectedIndex}
        onChange={(event, newValue) => {
          switch (newValue) {
            case 0:
              router.push('/');
              break;
            case 1:
              router.push('/expenses');
              break;
          }
        }}
      >
        <BottomNavigationAction label="Home" icon={<QueryStatsIcon />} />
        <BottomNavigationAction label="Despesas" icon={<AssignmentIcon />} />
        {/* <BottomNavigationAction label="Receitas" icon={<AssignmentIcon />} /> */}
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
  right: 0,
  margin: '0 auto',
});