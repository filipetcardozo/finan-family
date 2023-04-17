import React, { useContext } from 'react';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import Select from '@mui/material/Select';
import { useFormik } from 'formik';
import { IInvoice } from '../providers/invoices/types';
import dayjs, { Dayjs } from 'dayjs';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { MobileDatePicker } from '@mui/x-date-pickers/MobileDatePicker';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import 'dayjs/locale/pt-br';
import { useAuth } from '../hooks/useAuth';
import { putInvoice, updateInvoice } from '../providers/invoices/services';
import LoadingButton from '@mui/lab/LoadingButton';
import { useSnackbar } from 'notistack';
import { CurrencyInput } from './InputCurrency';
import { ExpensesContext } from '../contexts/Expenses';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import { IRevenue } from '../providers/revenues/types';
import { putRevenue, updateRevenue } from '../providers/revenues/services';
import { RevenuesContext } from '../contexts/Revenues';

interface IProps {
  open: boolean,
  handleClose(): void;
  invoice?: IInvoice;
  revenue?: IRevenue;
}

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

export const AddInvoiceModal = ({ open, handleClose, invoice, revenue }: IProps) => {
  const { uid } = useAuth()
  const { enqueueSnackbar } = useSnackbar();

  const { handleAddInvoice, handleUpdateInvoice } = useContext(ExpensesContext);
  const { handleAddRevenue, handleUpdateRevenue } = useContext(RevenuesContext);

  const initialValuesExpenseForm: IInvoice = {
    addDate: dayjs(new Date()),
    addDateFormatted: dayjs(new Date()).format('MM/YYYY').toString(),
    description: '',
    invoiceCategory: '',
    value: undefined,
    userId: '',
    id: ''
  };

  const initialValuesRevenueForm: IRevenue = {
    addDate: dayjs(new Date()),
    addDateFormatted: dayjs(new Date()).format('MM/YYYY').toString(),
    description: '',
    revenueCategory: '',
    value: undefined,
    userId: '',
    id: ''
  };

  React.useEffect(() => {
    if (invoice && invoice.id) {
      formExpense.setFieldValue('addDate', invoice.addDate);
      formExpense.setFieldValue('addDateFilter', invoice.addDateFormatted);
      formExpense.setFieldValue('description', invoice.description);
      formExpense.setFieldValue('invoiceCategory', invoice.invoiceCategory);
      formExpense.setFieldValue('value', invoice.value);
      formExpense.setFieldValue('userId', invoice.userId);
      formExpense.setFieldValue('id', invoice.id);
    }
  }, [invoice]);

  React.useEffect(() => {
    if (revenue && revenue.id) {
      formExpense.setFieldValue('addDate', revenue.addDate);
      formExpense.setFieldValue('addDateFilter', revenue.addDateFormatted);
      formExpense.setFieldValue('description', revenue.description);
      formExpense.setFieldValue('revenueCategory', revenue.revenueCategory);
      formExpense.setFieldValue('value', revenue.value);
      formExpense.setFieldValue('userId', revenue.userId);
      formExpense.setFieldValue('id', revenue.id);
    }
  }, [revenue]);

  const [loadingButton, setLoadingButton] = React.useState(false);
  const formExpense = useFormik({
    initialValues: initialValuesExpenseForm,
    onSubmit: async values => {
      setLoadingButton(true);

      if (invoice && invoice.id) {
        await updateInvoice({ ...formExpense.values })
          .then(() => {
            enqueueSnackbar('Despesa alterada', { autoHideDuration: 2000, variant: 'success', anchorOrigin: { horizontal: 'center', vertical: 'top' } });
            if (handleUpdateInvoice) {
              handleUpdateInvoice({ ...formExpense.values });
            }
            handleClose();
          })
          .catch((err) => {
            console.log(err)
            enqueueSnackbar('Ops... tivemos um problema.', { autoHideDuration: 2000, variant: 'error', anchorOrigin: { horizontal: 'center', vertical: 'top' } });
          })
          .finally(() => {
            setLoadingButton(false);
          })
      } else {
        let newValues = { ...values };
        newValues.userId = uid;

        await putInvoice(newValues)
          .then((v) => {
            enqueueSnackbar('Despesa lançada', { autoHideDuration: 2000, variant: 'success', anchorOrigin: { horizontal: 'center', vertical: 'top' } });
            handleAddInvoice(v);
            formExpense.resetForm();
            formExpense.setFieldValue('value', null);
            handleClose();
          })
          .catch((err) => {
            enqueueSnackbar('Ops... tivemos um problema.', { autoHideDuration: 2000, variant: 'error', anchorOrigin: { horizontal: 'center', vertical: 'top' } });
          })
          .finally(() => {
            setLoadingButton(false);
          })
      }
    }
  });

  const formRevenue = useFormik({
    initialValues: initialValuesRevenueForm,
    onSubmit: async values => {
      setLoadingButton(true);

      if (invoice && invoice.id) {
        await updateRevenue({ ...formRevenue.values })
          .then(() => {
            enqueueSnackbar('Receita alterada', { autoHideDuration: 2000, variant: 'success', anchorOrigin: { horizontal: 'center', vertical: 'top' } });
            if (handleUpdateRevenue) {
              handleUpdateRevenue({ ...formRevenue.values });
            }
            handleClose();
          })
          .catch((err) => {
            console.log(err)
            enqueueSnackbar('Ops... tivemos um problema.', { autoHideDuration: 2000, variant: 'error', anchorOrigin: { horizontal: 'center', vertical: 'top' } });
          })
          .finally(() => {
            setLoadingButton(false);
          })
      } else {
        let newValues = { ...values };
        newValues.userId = uid;

        await putRevenue(newValues)
          .then((v) => {
            enqueueSnackbar('Receita lançada', { autoHideDuration: 2000, variant: 'success', anchorOrigin: { horizontal: 'center', vertical: 'top' } });
            handleAddRevenue(v);
            formRevenue.resetForm();
            formRevenue.setFieldValue('value', null);
            handleClose();
          })
          .catch((err) => {
            enqueueSnackbar('Ops... tivemos um problema.', { autoHideDuration: 2000, variant: 'error', anchorOrigin: { horizontal: 'center', vertical: 'top' } });
          })
          .finally(() => {
            setLoadingButton(false);
          })
      }
    }
  });

  // Tabs
  const [value, setValue] = React.useState(0);

  const handleChange = (event: React.SyntheticEvent, newValue: number) => {
    setValue(newValue);
  };

  function a11yProps(index: number) {
    return {
      id: `tab-${index}`,
      'aria-controls': `tabpanel-${index}`,
    };
  }



  return <Dialog open={open} onClose={handleClose} fullWidth >
    <div>
      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs value={value} onChange={handleChange} aria-label='tab revenue or expense' centered variant='fullWidth'>
          <Tab label='Despesa' {...a11yProps(0)} />
          <Tab label='Receita' {...a11yProps(1)} />
        </Tabs>
      </Box>
      <TabPanel value={value} index={0}>
        <DialogTitle>
          {invoice && invoice.id ? 'Alterar despesa' : 'Inserir despesa'}
        </DialogTitle>
        <form onSubmit={formExpense.handleSubmit}>
          <DialogContent sx={{ paddingTop: 0 }}>
            <FormControl fullWidth margin='normal' size='small'>
              <InputLabel id="invoice-category-label">Categoria da despesa</InputLabel>
              <Select
                label='Categoria da despesa' labelId="invoice-category-label"
                name='invoiceCategory' id="invoiceCategory"
                onChange={formExpense.handleChange}
                value={formExpense.values.invoiceCategory}
                variant='outlined' size='small' type='text'
                autoComplete='off' margin='dense'
              >
                <MenuItem value='Alimentação'>Alimentação</MenuItem>
                <MenuItem value='Contas'>Contas</MenuItem>
                <MenuItem value='Combustível'>Combustível</MenuItem>
                <MenuItem value='Transporte'>Transporte</MenuItem>
                <MenuItem value='Padaria'>Padaria</MenuItem>
                <MenuItem value='Casa'>Casa</MenuItem>
                <MenuItem value='Entretenimento'>Entretenimento</MenuItem>
                <MenuItem value='Restaurante'>Restaurante</MenuItem>
                <MenuItem value='Financiamento'>Financiamento</MenuItem>
                <MenuItem value='Roupas'>Roupas</MenuItem>
                <MenuItem value='Pets'>Pets</MenuItem>
                <MenuItem value='Manutenção carro'>Manutenção carro</MenuItem>
                <MenuItem value='Faculdade'>Faculdade</MenuItem>
                <MenuItem value='Telefone'>Telefone</MenuItem>
                <MenuItem value='Saúde'>Saúde</MenuItem>
                <MenuItem value='Estética'>Estética</MenuItem>
                <MenuItem value='Esportes'>Esportes</MenuItem>
              </Select>
            </FormControl>
            <CurrencyInput nameOfKeyValue='value' form={formExpense} />
            <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale='pt-BR'>
              <MobileDatePicker
                label="Data"
                value={formExpense.values.addDate}
                onChange={(v) => {
                  formExpense.setFieldValue('addDate', v)
                  formExpense.setFieldValue('addDateFormatted', v?.format('MM/YYYY').toString())
                }}
                renderInput={(params) => <TextField
                  {...params}
                  size='small'
                  margin='normal'
                  name='addDate'
                  autoComplete='off'
                  fullWidth
                />
                }
              />
            </LocalizationProvider>
            <TextField
              label='Descrição' name='description' id='description'
              onChange={formExpense.handleChange}
              value={formExpense.values.description}
              variant="outlined" size='small' margin='normal'
              autoComplete='off'
              type='text'
              fullWidth
              multiline
              rows={3}
            />
          </DialogContent>
          <DialogActions>
            <Button size='small' onClick={handleClose}>Voltar</Button>
            <LoadingButton type='submit' variant='contained' size='small' loading={loadingButton}>
              {invoice && invoice.id ? 'Atualizar' : 'Inserir'}
            </LoadingButton>
          </DialogActions>
        </form>
      </TabPanel>
      <TabPanel value={value} index={1}>
        <DialogTitle>
          {invoice && invoice.id ? 'Alterar receita' : 'Inserir receita'}
        </DialogTitle>
        <form onSubmit={formRevenue.handleSubmit}>
          <DialogContent sx={{ paddingTop: 0 }}>
            <FormControl fullWidth margin='normal' size='small'>
              <InputLabel id="revenue-category-label">Categoria da receita</InputLabel>
              <Select
                label='Categoria da receita' labelId="revenue-category-label"
                name='revenueCategory' id="revenueCategory"
                onChange={formRevenue.handleChange}
                value={formRevenue.values.revenueCategory}
                variant='outlined' size='small' type='text'
                autoComplete='off'
              >
                <MenuItem value='Salário'>Salário</MenuItem>
                <MenuItem value='Freelancer'>Freelancer</MenuItem>
                <MenuItem value='Empréstimos'>Empréstimos</MenuItem>
                <MenuItem value='Outros'>Outros</MenuItem>
              </Select>
            </FormControl>
            <CurrencyInput nameOfKeyValue='value' form={formRevenue} />
            <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale='pt-BR'>
              <MobileDatePicker
                label="Data"
                value={formRevenue.values.addDate}
                onChange={(v) => {
                  formRevenue.setFieldValue('addDate', v)
                  formRevenue.setFieldValue('addDateFormatted', v?.format('MM/YYYY').toString())
                }}
                renderInput={(params) => <TextField
                  {...params}
                  size='small'
                  margin='normal'
                  name='addDate'
                  autoComplete='off'
                  fullWidth
                />
                }
              />
            </LocalizationProvider>
            <TextField
              label='Descrição' name='description' id='description'
              onChange={formRevenue.handleChange}
              value={formRevenue.values.description}
              variant="outlined" size='small' margin='normal'
              autoComplete='off'
              type='text'
              fullWidth
              multiline
              rows={3}
            />
          </DialogContent>
          <DialogActions>
            <Button size='small' onClick={handleClose}>Voltar</Button>
            <LoadingButton type='submit' variant='contained' size='small' loading={loadingButton}>
              {revenue && revenue.id ? 'Atualizar' : 'Inserir'}
            </LoadingButton>
          </DialogActions>
        </form>
      </TabPanel>
    </div>

  </Dialog>
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`tabpanel-${index}`}
      aria-labelledby={`tab-${index}`}
      {...other}
    >
      {value === index && (
        children
      )}
    </div>
  );
}