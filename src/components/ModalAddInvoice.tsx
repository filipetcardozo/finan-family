import React, { useContext, useEffect } from 'react';
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
import { ExpensesContext } from '../contexts/expenses';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import { IRevenue } from '../providers/revenues/types';
import { putRevenue, updateRevenue } from '../providers/revenues/services';
import { RevenuesContext } from '../contexts/revenues';
import ListSubheader from '@mui/material/ListSubheader';
import { Autocomplete } from '@mui/material';

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

const expenseCategories = [
  { label: 'Supermercado', group: 'Alimentação & Entretenimento' },
  { label: 'Delivery', group: 'Alimentação & Entretenimento' },
  { label: 'Padaria', group: 'Alimentação & Entretenimento' },
  { label: 'Restaurante', group: 'Alimentação & Entretenimento' },
  { label: 'Distribuidora', group: 'Alimentação & Entretenimento' },
  { label: 'Atividades de Lazer', group: 'Alimentação & Entretenimento' },
  { label: 'Combustível', group: 'Despesas de Veículo' },
  { label: 'Lavagem automotiva', group: 'Despesas de Veículo' },
  { label: 'Manutenção do Veículo', group: 'Despesas de Veículo' },
  { label: 'Compra de peças para o veículo', group: 'Despesas de Veículo' },
  { label: 'Serviço de Transporte', group: 'Despesas de Veículo' },
  { label: 'Cuidados Pessoais', group: 'Despesas Comuns' },
  { label: 'Acessórios Pessoais', group: 'Despesas Comuns' },
  { label: 'Pets', group: 'Despesas Comuns' },
  { label: 'Vestuário', group: 'Despesas Comuns' },
  { label: 'Saúde', group: 'Despesas Comuns' },
  { label: 'Assinaturas Digitais', group: 'Tecnologia & Educação' },
  { label: 'Streaming de Vídeo', group: 'Tecnologia & Educação' },
  { label: 'Educação', group: 'Tecnologia & Educação' },
  { label: 'Telecomunicações', group: 'Tecnologia & Educação' },
  { label: 'Eletrônicos', group: 'Tecnologia & Educação' },
  { label: 'Aluguel', group: 'Casa' },
  { label: 'Contas', group: 'Casa' },
  { label: 'Reparos e Manutenção', group: 'Casa' },
  { label: 'Móveis e Decoração', group: 'Casa' },
  { label: 'Viagens', group: 'Lazer' },
  { label: 'Eventos', group: 'Lazer' },
  { label: 'Atividades Esportivas', group: 'Lazer' },
  { label: 'Atividades Recreativas', group: 'Lazer' },
  { label: 'Hobbies', group: 'Lazer' },
  { label: 'Presentes', group: 'Despesas com outras pessoas' },
  { label: 'Transferência bancária', group: 'Despesas com outras pessoas' },
  { label: 'Empréstimos', group: 'Despesas com outras pessoas' },
  { label: 'Financiamento', group: 'Outras opções' },
  { label: 'Cartão de Crédito', group: 'Outras opções' },
  { label: 'Materiais e equipamentos genéricos', group: 'Outras opções' },
  { label: 'Investimentos', group: 'Outras opções' },
  { label: 'Outros', group: 'Outras opções' },
];

const revenueCategories = [
  { label: 'Salário' },
  { label: 'Freelancer' },
  { label: 'Empréstimos' },
  { label: 'Outros' },
];

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
      formExpense.setFieldValue('addDateFormatted', invoice.addDateFormatted);
      formExpense.setFieldValue('description', invoice.description);
      formExpense.setFieldValue('invoiceCategory', invoice.invoiceCategory);
      formExpense.setFieldValue('value', invoice.value);
      formExpense.setFieldValue('userId', invoice.userId);
      formExpense.setFieldValue('id', invoice.id);
    }
  }, [invoice]);

  React.useEffect(() => {
    if (revenue && revenue.id) {
      formRevenue.setFieldValue('addDate', revenue.addDate);
      formRevenue.setFieldValue('addDateFormatted', revenue.addDateFormatted);
      formRevenue.setFieldValue('description', revenue.description);
      formRevenue.setFieldValue('revenueCategory', revenue.revenueCategory);
      formRevenue.setFieldValue('value', revenue.value);
      formRevenue.setFieldValue('userId', revenue.userId);
      formRevenue.setFieldValue('id', revenue.id);
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

      if (revenue && revenue.id) {
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
  const [tabSelected, setTabSelected] = React.useState(0);

  useEffect(() => {
    if (revenue?.id) {
      setTabSelected(1);
    }
  }, [revenue?.id])

  const handleChangeTab = (event: React.SyntheticEvent, newValue: number) => {
    setTabSelected(newValue);
  };

  function a11yProps(index: number) {
    return {
      id: `tab-${index}`,
      'aria-controls': `tabpanel-${index}`,
    };
  }

  return <Dialog open={open} onClose={handleClose} fullWidth>
    <div>
      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs value={tabSelected} onChange={handleChangeTab} aria-label='tab revenue or expense' centered variant='fullWidth'>
          <Tab label='Despesa' {...a11yProps(0)} />
          <Tab label='Receita' {...a11yProps(1)} />
        </Tabs>
      </Box>
      <TabPanel value={tabSelected} index={0}>
        <DialogTitle>
          {invoice && invoice.id ? 'Alterar despesa' : 'Inserir despesa'}
        </DialogTitle>
        <form onSubmit={formExpense.handleSubmit}>
          <DialogContent sx={{ paddingTop: 0 }}>
            <FormControl fullWidth margin='normal' size='small'>
              <Autocomplete
                options={expenseCategories}
                getOptionLabel={(option) => option.label}
                groupBy={(option) => option.group}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Categoria da despesa"
                    variant="outlined"
                    size="small"
                    margin="dense"
                  />
                )}
                onChange={(event, value) => formExpense.setFieldValue('invoiceCategory', value ? value.label : '')}
                value={expenseCategories.find(option => option.label === formExpense.values.invoiceCategory) || null}
              />
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
      <TabPanel value={tabSelected} index={1}>
        <DialogTitle>
          {invoice && invoice.id ? 'Alterar receita' : 'Inserir receita'}
        </DialogTitle>
        <form onSubmit={formRevenue.handleSubmit}>
          <DialogContent sx={{ paddingTop: 0 }}>
            <FormControl fullWidth margin='normal' size='small'>
              <Autocomplete
                options={revenueCategories}
                getOptionLabel={(option) => option.label}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Categoria da receita"
                    variant="outlined"
                    size="small"
                    margin="dense"
                  />
                )}
                onChange={(event, value) => formRevenue.setFieldValue('revenueCategory', value ? value.label : '')}
                value={revenueCategories.find(option => option.label === formRevenue.values.revenueCategory) || null}
              />
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