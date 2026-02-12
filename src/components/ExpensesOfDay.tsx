import React from 'react';
import { IInvoice } from '../providers/invoices/types';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemText from '@mui/material/ListItemText';
import ListItemAvatar from '@mui/material/ListItemAvatar';
import Avatar from '@mui/material/Avatar';
import { Box } from '@mui/material';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import { formatterCurrency } from '../utils/formatters';

interface Props {
  expensesOfDay: IInvoice[] | [];
}

export const ExpensesOfDay: React.FC<Props> = ({ expensesOfDay }) => {
  const SecondaryText = ({ invoice }: { invoice: IInvoice }) => {
    return (
      <span>
        <Box component='span' sx={{ color: '#0e4d66', fontWeight: 700 }}>
          {formatterCurrency(invoice.value!)}
        </Box>
        &nbsp;
        {invoice.description && (
          <Box component='span' sx={{ fontSize: 14 }}>
            - {invoice.description}
          </Box>
        )}
      </span>
    );
  };

  return (
    <List sx={{ width: '100%', maxWidth: 500, py: 0, pr: 0.5 }}>
      {expensesOfDay.map(v => {
        return (
          <ListItem
            dense
            key={`${v.id}-${v.invoiceCategory}-${v.value}`}
            sx={{
              my: 0.5,
              borderRadius: 2.5,
              border: '1px solid rgba(17, 56, 80, 0.09)',
              backgroundColor: '#ffffffba',
            }}
          >
            <ListItemAvatar>
              <Avatar sx={{ width: 34, height: 34, bgcolor: '#d9ecf8', color: '#104e69' }}>
                <AttachMoneyIcon sx={{ fontSize: 18 }} />
              </Avatar>
            </ListItemAvatar>
            <ListItemText
              primary={
                <Box component='span' sx={{ fontSize: 14, color: '#0f3248', fontWeight: 700 }}>
                  {v.invoiceCategory}
                </Box>
              }
              secondary={<SecondaryText invoice={v} />}
            />
          </ListItem>
        );
      })}
    </List>
  );
};
