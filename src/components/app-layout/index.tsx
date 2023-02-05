import { ReactNode, useState, useMemo } from "react"
import { Fab } from '@mui/material'
import AddIcon from '@mui/icons-material/Add';
import Box from "@mui/material/Box";
import BottomNavigation from '@mui/material/BottomNavigation';
import BottomNavigationAction from '@mui/material/BottomNavigationAction';
import AssignmentIcon from '@mui/icons-material/AssignmentOutlined';
import QueryStatsIcon from '@mui/icons-material/QueryStatsOutlined';
import { useRouter } from "next/router";
import { AddInvoiceModal } from "../modal-addInvoice";

type Props = {
  children: ReactNode,
  tabSelected: '/' | '/invoice-entries'
}

export const LayoutMobile = ({ children, tabSelected }: Props) => {
  const router = useRouter()

  const tabSelectedIndex = useMemo(() => {
    switch (tabSelected) {
      case '/':
        return 0;
      case '/invoice-entries':
        return 1;
      default:
        return undefined;
    }
  }, [tabSelected])

  const [openAddInvoiceModal, setOpenAddInvoiceModal] = useState(false);
  const handleCloseModal = () => setOpenAddInvoiceModal(false);
  const handleOpenModal = () => setOpenAddInvoiceModal(true);

  return <>
    {children}
    <Box sx={{ position: 'fixed', right: 15, bottom: 70 }}>
      <Fab onClick={handleOpenModal} size='small' color='info' aria-label='add'>
        <AddIcon fontSize='small' />
      </Fab>
    </Box>
    <Box sx={{ position: 'fixed', bottom: 0, left: 0, right: 0 }}>
      <BottomNavigation
        showLabels
        value={tabSelectedIndex}
        onChange={(event, newValue) => {
          switch (newValue) {
            case 0:
              router.push('/');
              break;
            case 1:
              router.push('/invoice-entries');
              break;
          }
        }}
        sx={{ backgroundColor: 'white' }}
      >
        <BottomNavigationAction label="Home" icon={<QueryStatsIcon />} />
        <BottomNavigationAction label="Lançamentos" icon={<AssignmentIcon />} />
      </BottomNavigation>
    </Box>
    <AddInvoiceModal open={openAddInvoiceModal} handleClose={handleCloseModal} />
  </>
}