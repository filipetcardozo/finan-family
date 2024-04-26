import React from 'react';
import { IInvoice } from "../providers/invoices/types";
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemText from '@mui/material/ListItemText';
import ListItemAvatar from '@mui/material/ListItemAvatar';
import Avatar from '@mui/material/Avatar';
import { formatterCurrency } from '../utils/formatters';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import { Box, Typography } from '@mui/material';

interface props {
  expensesOfDay: IInvoice[] | [];
};

export const ExpensesOfDay: React.FC<props> = ({ expensesOfDay }) => {

  const SecondaryText = ({ invoice }: { invoice: IInvoice }) => {
    return <span>
      {formatterCurrency(invoice.value!)}
      &nbsp;
      {invoice.description && <Box component='span' sx={{ fontSize: 14 }}>
        - {invoice.description}
      </Box>}
    </span>
  }

  if (expensesOfDay && expensesOfDay.length > 0) {
    return <List sx={{ width: '100%', maxWidth: 400, py: 0 }}>
      {
        expensesOfDay.map(v => {
          return <ListItem dense >
            <ListItemAvatar>
              <Avatar>
                <AttachMoneyIcon />
              </Avatar>
            </ListItemAvatar>
            <ListItemText primary={v.invoiceCategory} secondary={<SecondaryText invoice={v} />} />
          </ListItem>
        })
      }
    </List>
  } else {
    return <Typography variant='body2' color='ButtonShadow'>
      Ainda não foi inserida nenhuma despesa.
    </Typography>
  }
}