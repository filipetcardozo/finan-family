import React, { useContext, useEffect } from 'react';
import Dialog from '@mui/material/Dialog';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Box from '@mui/material/Box';
import { useFormik } from 'formik';
import 'dayjs/locale/pt-br';
import { useSnackbar } from 'notistack';
import { useAuth } from '../../hooks/useAuth';
import { CategoriesContext } from '../../contexts/categories';
import { MonthSelectedContext } from '../../contexts/monthSelected';
import { ExpensesContext } from '../../contexts/expenses';
import { RevenuesContext } from '../../contexts/revenues';
import { getCategoryGroupLabel } from '../../utils/categoryGroupLabels';
import type { IInvoice } from '../../providers/invoices/types';
import { putInvoice, updateInvoice } from '../../providers/invoices/services';
import { createInstallmentPurchaseId, putInstallmentInvoices } from '../../providers/invoices/installments';
import { isValidInstallmentCount } from '../../utils/installments';
import type { IRevenue } from '../../providers/revenues/types';
import { putRevenue, updateRevenue } from '../../providers/revenues/services';
import { TabPanel } from './TabPanel';
import { TransactionFormSection } from './TransactionFormSection';
import { InstallmentOptions } from './InstallmentOptions';
import {
  getDefaultAddDateBySelectedMonth,
  primaryActionSx,
  secondaryActionSx,
} from './constants';

interface IProps {
  open: boolean;
  handleClose(): void;
  invoice?: IInvoice;
  revenue?: IRevenue;
}

export const AddInvoiceModal = ({ open, handleClose, invoice, revenue }: IProps) => {
  const { uid } = useAuth();
  const { enqueueSnackbar } = useSnackbar();
  const { dateToAnalyze } = useContext(MonthSelectedContext);
  const { expenseCategoryOptions, revenueCategoryOptions } = useContext(CategoriesContext);

  const { handleAddInvoices, handleUpdateInvoice } = useContext(ExpensesContext);
  const { handleAddRevenue, handleUpdateRevenue } = useContext(RevenuesContext);

  const defaultAddDate = getDefaultAddDateBySelectedMonth(dateToAnalyze);

  const initialValuesExpenseForm: IInvoice = {
    addDate: defaultAddDate,
    addDateFormatted: defaultAddDate.format('MM/YYYY').toString(),
    description: '',
    invoiceCategory: '',
    value: undefined,
    userId: '',
    id: '',
  };

  const initialValuesRevenueForm: IRevenue = {
    addDate: defaultAddDate,
    addDateFormatted: defaultAddDate.format('MM/YYYY').toString(),
    description: '',
    revenueCategory: '',
    value: undefined,
    userId: '',
    id: '',
  };

  const [loadingButton, setLoadingButton] = React.useState(false);
  const [installmentPurchase, setInstallmentPurchase] = React.useState(false);
  const [installmentCount, setInstallmentCount] = React.useState('2');
  const installmentPurchaseId = React.useRef<string | null>(null);
  const submittingExpense = React.useRef(false);
  const validInstallments = isValidInstallmentCount(Number(installmentCount));

  useEffect(() => {
    setInstallmentPurchase(false);
    setInstallmentCount('2');
    installmentPurchaseId.current = null;
  }, [open, invoice?.id, revenue?.id, dateToAnalyze]);

  const closeWhenIdle = () => {
    if (!loadingButton && !submittingExpense.current) handleClose();
  };

  const formExpense = useFormik({
    initialValues: initialValuesExpenseForm,
    onSubmit: async (values) => {
      if (submittingExpense.current) return;
      if (!invoice?.id && installmentPurchase && !validInstallments) {
        enqueueSnackbar('Revise a quantidade de parcelas.', { variant: 'error' });
        return;
      }
      submittingExpense.current = true;
      setLoadingButton(true);

      if (invoice && invoice.id) {
        await updateInvoice({ ...formExpense.values })
          .then(() => {
            enqueueSnackbar('Despesa alterada', {
              autoHideDuration: 2000,
              variant: 'success',
              anchorOrigin: { horizontal: 'center', vertical: 'top' },
            });
            if (handleUpdateInvoice) handleUpdateInvoice({ ...formExpense.values });
            handleClose();
          })
          .catch((err) => {
            console.log(err);
            enqueueSnackbar('Ops... tivemos um problema.', {
              autoHideDuration: 2000,
              variant: 'error',
              anchorOrigin: { horizontal: 'center', vertical: 'top' },
            });
          })
          .finally(() => {
            submittingExpense.current = false;
            setLoadingButton(false);
          });
      } else {
        const newValues = { ...values, userId: uid };
        let creation: Promise<IInvoice[]>;
        if (installmentPurchase) {
          if (!installmentPurchaseId.current) installmentPurchaseId.current = createInstallmentPurchaseId();
          creation = putInstallmentInvoices(newValues, Number(installmentCount), installmentPurchaseId.current);
        } else {
          creation = putInvoice(newValues).then(createdInvoice => [createdInvoice]);
        }

        await creation
          .then((createdInvoices) => {
            enqueueSnackbar(installmentPurchase ? 'Compra parcelada lançada' : 'Despesa lançada', {
              autoHideDuration: 2000,
              variant: 'success',
              anchorOrigin: { horizontal: 'center', vertical: 'top' },
            });
            handleAddInvoices(createdInvoices);
            formExpense.resetForm();
            formExpense.setFieldValue('value', null);
            handleClose();
          })
          .catch(() => {
            enqueueSnackbar('Ops... tivemos um problema.', {
              autoHideDuration: 2000,
              variant: 'error',
              anchorOrigin: { horizontal: 'center', vertical: 'top' },
            });
          })
          .finally(() => {
            submittingExpense.current = false;
            setLoadingButton(false);
          });
      }
    },
  });

  const formRevenue = useFormik({
    initialValues: initialValuesRevenueForm,
    onSubmit: async (values) => {
      setLoadingButton(true);

      if (revenue && revenue.id) {
        await updateRevenue({ ...formRevenue.values })
          .then(() => {
            enqueueSnackbar('Receita alterada', {
              autoHideDuration: 2000,
              variant: 'success',
              anchorOrigin: { horizontal: 'center', vertical: 'top' },
            });
            if (handleUpdateRevenue) handleUpdateRevenue({ ...formRevenue.values });
            handleClose();
          })
          .catch((err) => {
            console.log(err);
            enqueueSnackbar('Ops... tivemos um problema.', {
              autoHideDuration: 2000,
              variant: 'error',
              anchorOrigin: { horizontal: 'center', vertical: 'top' },
            });
          })
          .finally(() => {
            setLoadingButton(false);
          });
      } else {
        const newValues = { ...values, userId: uid };

        await putRevenue(newValues)
          .then((createdRevenue) => {
            enqueueSnackbar('Receita lançada', {
              autoHideDuration: 2000,
              variant: 'success',
              anchorOrigin: { horizontal: 'center', vertical: 'top' },
            });
            handleAddRevenue(createdRevenue);
            formRevenue.resetForm();
            formRevenue.setFieldValue('value', null);
            handleClose();
          })
          .catch(() => {
            enqueueSnackbar('Ops... tivemos um problema.', {
              autoHideDuration: 2000,
              variant: 'error',
              anchorOrigin: { horizontal: 'center', vertical: 'top' },
            });
          })
          .finally(() => {
            setLoadingButton(false);
          });
      }
    },
  });

  useEffect(() => {
    if (invoice && invoice.id) {
      formExpense.setFieldValue('addDate', invoice.addDate);
      formExpense.setFieldValue('addDateFormatted', invoice.addDateFormatted);
      formExpense.setFieldValue('description', invoice.description);
      formExpense.setFieldValue('invoiceCategory', invoice.invoiceCategory);
      formExpense.setFieldValue('value', invoice.value);
      formExpense.setFieldValue('userId', invoice.userId);
      formExpense.setFieldValue('id', invoice.id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [invoice]);

  useEffect(() => {
    if (revenue && revenue.id) {
      formRevenue.setFieldValue('addDate', revenue.addDate);
      formRevenue.setFieldValue('addDateFormatted', revenue.addDateFormatted);
      formRevenue.setFieldValue('description', revenue.description);
      formRevenue.setFieldValue('revenueCategory', revenue.revenueCategory);
      formRevenue.setFieldValue('value', revenue.value);
      formRevenue.setFieldValue('userId', revenue.userId);
      formRevenue.setFieldValue('id', revenue.id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [revenue]);

  useEffect(() => {
    if (!open || invoice?.id || revenue?.id) return;

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dateToAnalyze, invoice?.id, open, revenue?.id]);

  const [tabSelected, setTabSelected] = React.useState(0);

  useEffect(() => {
    if (revenue?.id) setTabSelected(1);
  }, [revenue?.id]);

  const handleChangeTab = (_event: React.SyntheticEvent, newValue: number) => {
    setTabSelected(newValue);
  };

  const expenseGroupBy = expenseCategoryOptions.some(option => option.group)
    ? (option: { group?: string }) => getCategoryGroupLabel(option.group) || 'Sem grupo'
    : undefined;
  const revenueGroupBy = revenueCategoryOptions.some(option => option.group)
    ? (option: { group?: string }) => getCategoryGroupLabel(option.group) || 'Sem grupo'
    : undefined;

  const a11yProps = (index: number) => ({
    id: `tab-${index}`,
    'aria-controls': `tabpanel-${index}`,
  });

  return (
    <Dialog open={open} onClose={closeWhenIdle} fullWidth maxWidth="sm">
      <div>
        <Box
          sx={{
            px: 1.2,
            pt: 1.2,
            pb: 0.6,
            background:
              'linear-gradient(136deg, rgba(8,43,67,0.06) 0%, rgba(15,106,114,0.08) 48%, rgba(21,145,124,0.08) 100%)',
            borderBottom: '1px solid rgba(8, 43, 67, 0.12)',
          }}
        >
          <Tabs
            value={tabSelected}
            onChange={handleChangeTab}
            aria-label="tab revenue or expense"
            centered
            variant="fullWidth"
            sx={{
              minHeight: 40,
              '& .MuiTabs-indicator': {
                height: 3,
                borderRadius: 3,
                background: 'linear-gradient(90deg, #0f6a72 0%, #15917c 100%)',
              },
            }}
          >
            <Tab
              label="Despesa"
              disabled={loadingButton}
              {...a11yProps(0)}
              sx={{ minHeight: 40, fontSize: 12.5, fontWeight: 700, color: '#2a4f64' }}
            />
            <Tab
              label="Receita"
              disabled={loadingButton}
              {...a11yProps(1)}
              sx={{ minHeight: 40, fontSize: 12.5, fontWeight: 700, color: '#2a4f64' }}
            />
          </Tabs>
        </Box>

        <TabPanel value={tabSelected} index={0}>
          <TransactionFormSection
            title={invoice && invoice.id ? 'Alterar despesa' : 'Inserir despesa'}
            form={formExpense}
            onSubmit={formExpense.handleSubmit}
            dialogContentSx={{ pt: 2, pb: 1 }}
            stackSpacing={2}
            categoryOptions={expenseCategoryOptions}
            categoryValue={formExpense.values.invoiceCategory}
            onCategoryChange={(value) => formExpense.setFieldValue('invoiceCategory', value)}
            groupBy={expenseGroupBy}
            loading={loadingButton}
            submitLabel={invoice?.id ? 'Atualizar' : installmentPurchase
              ? (validInstallments ? `Lançar ${Number(installmentCount)} parcelas` : 'Lançar parcelas') : 'Inserir'}
            submitDisabled={!invoice?.id && installmentPurchase && !validInstallments}
            valueLabel={!invoice?.id && installmentPurchase ? 'Valor da parcela' : undefined}
            handleClose={closeWhenIdle}
            secondaryActionSx={secondaryActionSx}
            primaryActionSx={primaryActionSx}
          >
            {!invoice?.id && <InstallmentOptions
              checked={installmentPurchase} count={installmentCount} value={formExpense.values.value}
              disabled={loadingButton} onCheckedChange={setInstallmentPurchase} onCountChange={setInstallmentCount}
            />}
          </TransactionFormSection>
        </TabPanel>

        <TabPanel value={tabSelected} index={1}>
          <TransactionFormSection
            title={revenue && revenue.id ? 'Alterar receita' : 'Inserir receita'}
            form={formRevenue}
            onSubmit={formRevenue.handleSubmit}
            dialogContentSx={{ pt: 2, pb: 1 }}
            stackSpacing={2}
            categoryOptions={revenueCategoryOptions}
            categoryValue={formRevenue.values.revenueCategory}
            onCategoryChange={(value) => formRevenue.setFieldValue('revenueCategory', value)}
            groupBy={revenueGroupBy}
            loading={loadingButton}
            submitLabel={revenue && revenue.id ? 'Atualizar' : 'Inserir'}
            handleClose={closeWhenIdle}
            secondaryActionSx={secondaryActionSx}
            primaryActionSx={primaryActionSx}
          />
        </TabPanel>
      </div>
    </Dialog>
  );
};
