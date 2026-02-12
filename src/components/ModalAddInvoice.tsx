import React, { useContext, useEffect } from 'react';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import FormControl from '@mui/material/FormControl';
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
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import { IRevenue } from '../providers/revenues/types';
import { putRevenue, updateRevenue } from '../providers/revenues/services';
import { RevenuesContext } from '../contexts/revenues';
import { Autocomplete } from '@mui/material';
import useMobile from '../hooks/useMobile';
import { MonthSelectedContext } from '../contexts/monthSelected';

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
  { label: 'Combustível', group: 'Despesas de Veículo' },
  { label: 'Lavagem automotiva', group: 'Despesas de Veículo' },
  { label: 'Manutenção do Veículo', group: 'Despesas de Veículo' },
  { label: 'Compra de peças para o veículo', group: 'Despesas de Veículo' },
  { label: 'Serviço de Transporte', group: 'Despesas de Veículo' },
  { label: 'Cuidados Pessoais', group: 'Despesas Comuns' },
  { label: 'Acessórios Pessoais', group: 'Despesas Comuns' },
  { label: 'Pets', group: 'Despesas Comuns' },
  { label: 'Vestuário', group: 'Despesas Comuns' },
  { label: 'Farmácia', group: 'Despesas Comuns' },
  { label: 'Saúde', group: 'Despesas Comuns' },
  { label: 'Assinaturas Digitais', group: 'Tecnologia & Educação' },
  { label: 'Streaming de Vídeo', group: 'Tecnologia & Educação' },
  { label: 'Educação', group: 'Tecnologia & Educação' },
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

const getDefaultAddDateBySelectedMonth = (dateToAnalyze: Dayjs): Dayjs => {
  if (dateToAnalyze.isAfter(dayjs(), 'month')) {
    return dateToAnalyze.startOf('month');
  }

  return dayjs(new Date());
};

export const AddInvoiceModal = ({ open, handleClose, invoice, revenue }: IProps) => {
  const { uid } = useAuth()
  const { enqueueSnackbar } = useSnackbar();
  const { isMobile } = useMobile();
  const { dateToAnalyze } = useContext(MonthSelectedContext);

  const { handleAddInvoice, handleUpdateInvoice } = useContext(ExpensesContext);
  const { handleAddRevenue, handleUpdateRevenue } = useContext(RevenuesContext);

  const defaultAddDate = getDefaultAddDateBySelectedMonth(dateToAnalyze);

  const initialValuesExpenseForm: IInvoice = {
    addDate: defaultAddDate,
    addDateFormatted: defaultAddDate.format('MM/YYYY').toString(),
    description: '',
    invoiceCategory: '',
    value: undefined,
    userId: '',
    id: ''
  };

  const initialValuesRevenueForm: IRevenue = {
    addDate: defaultAddDate,
    addDateFormatted: defaultAddDate.format('MM/YYYY').toString(),
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

  React.useEffect(() => {
    if (!open || invoice?.id || revenue?.id) {
      return;
    }

    const selectedDate = getDefaultAddDateBySelectedMonth(dateToAnalyze);

    const defaultExpenseValues: IInvoice = {
      ...initialValuesExpenseForm,
      addDate: selectedDate,
      addDateFormatted: selectedDate.format('MM/YYYY').toString(),
    };

    const defaultRevenueValues: IRevenue = {
      ...initialValuesRevenueForm,
      addDate: selectedDate,
      addDateFormatted: selectedDate.format('MM/YYYY').toString(),
    };

    formExpense.resetForm({ values: defaultExpenseValues });
    formRevenue.resetForm({ values: defaultRevenueValues });
  }, [dateToAnalyze, invoice?.id, open, revenue?.id]);

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

  const secondaryActionSx = {
    color: '#2a4f64',
    borderColor: 'rgba(8, 43, 67, 0.22)',
    '&:hover': {
      borderColor: 'rgba(8, 43, 67, 0.42)',
      backgroundColor: 'rgba(8, 43, 67, 0.05)',
    },
  };

  const primaryActionSx = {
    background: 'linear-gradient(136deg, #082b43 0%, #0f6a72 48%, #15917c 100%)',
    '&:hover': {
      background: 'linear-gradient(136deg, #0a3451 0%, #12747c 48%, #1aa188 100%)',
    },
  };

  return <Dialog
    open={open}
    onClose={handleClose}
    fullWidth
    maxWidth='sm'
  >
    <div>
      <Box
        sx={{
          px: 1.2,
          pt: 1.2,
          pb: 0.6,
          background: 'linear-gradient(136deg, rgba(8,43,67,0.06) 0%, rgba(15,106,114,0.08) 48%, rgba(21,145,124,0.08) 100%)',
          borderBottom: '1px solid rgba(8, 43, 67, 0.12)',
        }}
      >
        <Tabs
          value={tabSelected}
          onChange={handleChangeTab}
          aria-label='tab revenue or expense'
          centered
          variant='fullWidth'
          sx={{
            minHeight: 40,
            '& .MuiTabs-indicator': {
              height: 3,
              borderRadius: 3,
              background: 'linear-gradient(90deg, #0f6a72 0%, #15917c 100%)',
            },
          }}
        >
          <Tab label='Despesa' {...a11yProps(0)} sx={{ minHeight: 40, fontSize: 12.5, fontWeight: 700, color: '#2a4f64' }} />
          <Tab label='Receita' {...a11yProps(1)} sx={{ minHeight: 40, fontSize: 12.5, fontWeight: 700, color: '#2a4f64' }} />
        </Tabs>
      </Box>
      <TabPanel value={tabSelected} index={0}>
        <DialogTitle sx={{ fontSize: 20, fontWeight: 700, color: '#123047' }}>
          {invoice && invoice.id ? 'Alterar despesa' : 'Inserir despesa'}
        </DialogTitle>
        <form onSubmit={formExpense.handleSubmit}>
          <DialogContent sx={{ pt: 0.8, pb: 1.2 }}>
            <Stack spacing={2}>
            <FormControl fullWidth size='small'>
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
              variant="outlined" size='small'
              autoComplete='off'
              type='text'
              fullWidth
              multiline
              rows={3}
            />
            </Stack>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2.2, pt: 1.2 }}>
            <Button size='small' variant='outlined' onClick={handleClose} sx={secondaryActionSx}>Voltar</Button>
            <LoadingButton type='submit' variant='contained' size='small' loading={loadingButton} sx={primaryActionSx}>
              {invoice && invoice.id ? 'Atualizar' : 'Inserir'}
            </LoadingButton>
          </DialogActions>
        </form>
      </TabPanel>
      <TabPanel value={tabSelected} index={1}>
        <DialogTitle sx={{ fontSize: 20, fontWeight: 700, color: '#123047' }}>
          {revenue && revenue.id ? 'Alterar receita' : 'Inserir receita'}
        </DialogTitle>
        <form onSubmit={formRevenue.handleSubmit}>
          <DialogContent sx={{ pt: 0.8, pb: 1.2 }}>
            <Stack spacing={1}>
            <FormControl fullWidth size='small'>
              <Autocomplete
                options={revenueCategories}
                getOptionLabel={(option) => option.label}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Categoria da receita"
                    variant="outlined"
                    size="small"
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
              variant="outlined" size='small'
              autoComplete='off'
              type='text'
              fullWidth
              multiline
              rows={3}
            />
            </Stack>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2.2, pt: 1.2 }}>
            <Button size='small' variant='outlined' onClick={handleClose} sx={secondaryActionSx}>Voltar</Button>
            <LoadingButton type='submit' variant='contained' size='small' loading={loadingButton} sx={primaryActionSx}>
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
