import React, { useContext, useEffect } from 'react';
import Dialog from '@mui/material/Dialog';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Box from '@mui/material/Box';
import Alert from '@mui/material/Alert';
import AddRoundedIcon from '@mui/icons-material/AddRounded';
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
import { createInstallmentPurchaseId, getInstallmentPurchaseInvoices, queueInstallmentInvoices, updateInstallmentPurchase } from '../../providers/invoices/installments';
import { createLaunchId } from '../../providers/offline/launches';
import { formatInstallmentDescription, getInstallmentBaseDescription, getInstallmentPosition, getInstallmentPurchaseId, isInstallmentInvoice, isValidInstallmentCount } from '../../utils/installments';
import type { IRevenue } from '../../providers/revenues/types';
import { putRevenue, updateRevenue } from '../../providers/revenues/services';
import { TabPanel } from './TabPanel';
import { TransactionFormSection } from './TransactionFormSection';
import { InstallmentOptions } from './InstallmentOptions';
import { MonthlyFixedOption } from './MonthlyFixedOption';
import { InstallmentEditOptions, InstallmentEditScope } from './InstallmentEditOptions';
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

  const { handleAddInvoices, handleUpdateInvoices } = useContext(ExpensesContext);
  const { handleAddRevenue, handleUpdateRevenue } = useContext(RevenuesContext);

  const defaultAddDate = getDefaultAddDateBySelectedMonth(dateToAnalyze);

  const initialValuesExpenseForm: IInvoice = {
    isMonthlyFixed: false,
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
  const expenseLaunchId = React.useRef<string | null>(null);
  const revenueLaunchId = React.useRef<string | null>(null);
  const submittingExpense = React.useRef(false);
  const submittingRevenue = React.useRef(false);
  const expenseValueInput = React.useRef<HTMLInputElement>(null);
  const revenueValueInput = React.useRef<HTMLInputElement>(null);
  const validInstallments = isValidInstallmentCount(Number(installmentCount));
  const editingInstallment = Boolean(invoice && isInstallmentInvoice(invoice));
  const canEditPurchase = editingInstallment && Boolean(invoice && getInstallmentPurchaseId(invoice));
  const [installmentEditScope, setInstallmentEditScope] = React.useState<InstallmentEditScope>('all');
  const [purchaseInvoices, setPurchaseInvoices] = React.useState<IInvoice[] | null>(null);
  const [purchaseLoadError, setPurchaseLoadError] = React.useState('');
  const [purchaseLoadAttempt, setPurchaseLoadAttempt] = React.useState(0);
  const updatingAllInstallments = canEditPurchase && installmentEditScope === 'all';

  useEffect(() => {
    setInstallmentPurchase(false);
    setInstallmentCount('2');
    setInstallmentEditScope('all');
    installmentPurchaseId.current = null;
    expenseLaunchId.current = null;
    revenueLaunchId.current = null;
  }, [open, invoice?.id, revenue?.id, dateToAnalyze]);

  useEffect(() => {
    if (!open || !invoice || !canEditPurchase) return;
    let cancelled = false;
    setPurchaseInvoices(null);
    setPurchaseLoadError('');
    getInstallmentPurchaseInvoices(uid, invoice)
      .then(entries => { if (!cancelled) setPurchaseInvoices(entries); })
      .catch(() => { if (!cancelled) setPurchaseLoadError('Não foi possível carregar as parcelas desta compra.'); });
    return () => { cancelled = true; };
  }, [open, invoice, canEditPurchase, uid, purchaseLoadAttempt]);

  const closeWhenIdle = () => {
    if (!loadingButton && !submittingExpense.current && !submittingRevenue.current) handleClose();
  };

  const formExpense = useFormik({
    initialValues: initialValuesExpenseForm,
    onSubmit: async (values) => {
      if (submittingExpense.current) return;
      if (invoice?.id && (invoice.pendingSync || !navigator.onLine)) {
        enqueueSnackbar('Aguarde a conexão e a sincronização para editar.', { variant: 'info' });
        return;
      }
      if (values.isMonthlyFixed && !values.addDate?.isValid()) {
        enqueueSnackbar('Selecione o mês de referência da despesa.', { variant: 'error' });
        return;
      }
      if (!invoice?.id && installmentPurchase && !validInstallments) {
        enqueueSnackbar('Revise a quantidade de parcelas.', { variant: 'error' });
        return;
      }
      if (updatingAllInstallments && (!purchaseInvoices || purchaseLoadError)) return;
      submittingExpense.current = true;
      setLoadingButton(true);

      if (invoice && invoice.id) {
        const position = getInstallmentPosition(invoice);
        const editedInvoice = {
          ...values,
          description: editingInstallment ? formatInstallmentDescription(values.description, position.number, position.count) : values.description,
        };
        const update = updatingAllInstallments
          ? updateInstallmentPurchase(uid, invoice, values)
          : updateInvoice(editedInvoice).then(() => [editedInvoice]);
        await update
          .then(updatedInvoices => {
            enqueueSnackbar(updatingAllInstallments ? `${updatedInvoices.length} parcelas atualizadas` : 'Despesa alterada', {
              autoHideDuration: 2000,
              variant: 'success',
              anchorOrigin: { horizontal: 'center', vertical: 'top' },
            });
            handleUpdateInvoices(updatedInvoices);
            handleClose();
          })
          .catch((err) => {
            console.log(err);
            enqueueSnackbar(updatingAllInstallments ? 'Não foi possível atualizar as parcelas. Tente novamente.' : 'Ops... tivemos um problema.', {
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
          creation = queueInstallmentInvoices(newValues, Number(installmentCount), installmentPurchaseId.current);
        } else {
          if (!expenseLaunchId.current) expenseLaunchId.current = createLaunchId('invoices');
          creation = putInvoice(newValues, expenseLaunchId.current).then(createdInvoice => [createdInvoice]);
        }

        await creation
          .then((createdInvoices) => {
            enqueueSnackbar(navigator.onLine ? (installmentPurchase ? 'Compra parcelada salva' : 'Despesa salva') : 'Salvo no dispositivo', {
              autoHideDuration: 2000,
              variant: 'success',
              anchorOrigin: { horizontal: 'center', vertical: 'top' },
            });
            handleAddInvoices(createdInvoices);
            formExpense.resetForm();
            formExpense.setFieldValue('value', null);
            handleClose();
          })
          .catch((error) => {
            enqueueSnackbar(error instanceof Error ? error.message : 'Não foi possível salvar o lançamento.', {
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
      if (submittingRevenue.current) return;
      if (revenue?.id && (revenue.pendingSync || !navigator.onLine)) {
        enqueueSnackbar('Aguarde a conexão e a sincronização para editar.', { variant: 'info' });
        return;
      }
      submittingRevenue.current = true;
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
            submittingRevenue.current = false;
            setLoadingButton(false);
          });
      } else {
        const newValues = { ...values, userId: uid };

        if (!revenueLaunchId.current) revenueLaunchId.current = createLaunchId('revenues');
        await putRevenue(newValues, revenueLaunchId.current)
          .then((createdRevenue) => {
            enqueueSnackbar(navigator.onLine ? 'Receita salva' : 'Salvo no dispositivo', {
              autoHideDuration: 2000,
              variant: 'success',
              anchorOrigin: { horizontal: 'center', vertical: 'top' },
            });
            handleAddRevenue(createdRevenue);
            formRevenue.resetForm();
            formRevenue.setFieldValue('value', null);
            handleClose();
          })
          .catch((error) => {
            enqueueSnackbar(error instanceof Error ? error.message : 'Não foi possível salvar o lançamento.', {
              autoHideDuration: 2000,
              variant: 'error',
              anchorOrigin: { horizontal: 'center', vertical: 'top' },
            });
          })
          .finally(() => {
            submittingRevenue.current = false;
            setLoadingButton(false);
          });
      }
    },
  });

  useEffect(() => {
    if (invoice && invoice.id) {
      formExpense.setValues({
        ...invoice,
        description: isInstallmentInvoice(invoice) ? getInstallmentBaseDescription(invoice.description) : invoice.description,
        isMonthlyFixed: invoice.isMonthlyFixed ?? false,
      });
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

  const focusValueAfterOpen = (dialog: HTMLElement) => {
    if (!open || invoice?.id || revenue?.id) return;
    const input = tabSelected === 0 ? expenseValueInput.current : revenueValueInput.current;
    if (!input?.isConnected || input.matches(':disabled')) return;
    const activeElement = dialog.ownerDocument.activeElement;
    // Do not steal focus if the user already chose another field during opening.
    if (activeElement && activeElement !== input && dialog.contains(activeElement)
      && activeElement.matches('input, textarea, select, button, a[href], [role="combobox"]')) return;
    input.focus({ preventScroll: true });
  };

  useEffect(() => {
    if (!open) return;
    if (invoice?.id) setTabSelected(0);
    else if (revenue?.id) setTabSelected(1);
  }, [open, invoice?.id, revenue?.id]);

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

  const monthlyFixedOption = (
    <MonthlyFixedOption
      checked={Boolean(formExpense.values.isMonthlyFixed)}
      disabled={loadingButton}
      onChange={checked => formExpense.setFieldValue('isMonthlyFixed', checked)}
    />
  );

  return (
    <Dialog open={open} disableEscapeKeyDown fullWidth maxWidth="sm"
      aria-label={tabSelected === 0 ? 'Lançamento de despesa' : 'Lançamento de receita'}
      TransitionProps={{ onEntered: focusValueAfterOpen }}
      PaperProps={{ sx: { borderRadius: 3 } }}
    >
      <div>
        <Box
          sx={{
            px: 1.2,
            pt: 1.2,
            pb: 0.6,
            background:
              'var(--subtle)',
            borderBottom: '1px solid var(--border)',
          }}
        >
          <Tabs
            value={tabSelected}
            onChange={handleChangeTab}
            aria-label="Tipo de lançamento"
            centered
            variant="fullWidth"
            sx={{
              minHeight: 48,
              '& .MuiTab-root': {
                minHeight: 48,
                minWidth: 0,
                borderRadius: 2,
                fontSize: 14,
                fontWeight: 500,
                textTransform: 'none',
                color: 'var(--muted)',
                transition: 'color .2s, background-color .2s, font-size .2s',
                '&.Mui-selected': {
                  fontSize: 17,
                  fontWeight: 700,
                  color: 'var(--primary-text)',
                  backgroundColor: 'var(--surface)',
                  boxShadow: 'var(--shadow)',
                },
              },
              '& .MuiTabs-indicator': {
                height: 3,
                borderRadius: 3,
                background: 'linear-gradient(90deg, var(--primary), var(--secondary))',
              },
            }}
          >
            <Tab
              label="Despesa"
              disabled={loadingButton}
              {...a11yProps(0)}
            />
            <Tab
              label="Receita"
              disabled={loadingButton}
              {...a11yProps(1)}
            />
          </Tabs>
        </Box>

        <TabPanel value={tabSelected} index={0}>
          <TransactionFormSection
            form={formExpense}
            onSubmit={formExpense.handleSubmit}
            dialogContentSx={{ pt: 3, pb: 1 }}
            stackSpacing={2}
            categoryOptions={expenseCategoryOptions}
            categoryValue={formExpense.values.invoiceCategory}
            onCategoryChange={(value) => formExpense.setFieldValue('invoiceCategory', value)}
            groupBy={expenseGroupBy}
            loading={loadingButton}
            submitLabel={invoice?.id ? (editingInstallment
              ? (updatingAllInstallments ? (purchaseInvoices ? `Atualizar ${purchaseInvoices.length} ${purchaseInvoices.length === 1 ? 'parcela' : 'parcelas'}` : 'Atualizar parcelas') : 'Atualizar parcela')
              : 'Atualizar despesa') : installmentPurchase
              ? (validInstallments ? `Lançar ${Number(installmentCount)} parcelas` : 'Lançar parcelas') : 'Lançar despesa'}
            submitIcon={invoice?.id ? null : <AddRoundedIcon />}
            submitDisabled={(!invoice?.id && installmentPurchase && !validInstallments) || (updatingAllInstallments && (!purchaseInvoices || Boolean(purchaseLoadError)))}
            valueLabel={editingInstallment || (!invoice?.id && installmentPurchase) ? 'Valor da parcela' : undefined}
            valueInputRef={expenseValueInput}
            autoFocusValue={!invoice?.id && !revenue?.id}
            allowMonthlyFixed={!editingInstallment && !installmentPurchase}
            handleClose={closeWhenIdle}
            secondaryActionSx={secondaryActionSx}
            primaryActionSx={primaryActionSx}
          >
            {editingInstallment && (canEditPurchase ? <InstallmentEditOptions
              scope={installmentEditScope} onChange={setInstallmentEditScope}
              loading={!purchaseInvoices && !purchaseLoadError} disabled={loadingButton}
              error={purchaseLoadError} onRetry={() => setPurchaseLoadAttempt(attempt => attempt + 1)}
            /> : <Alert severity='info' sx={{ mt: 2 }}>Esta parcela não tem vínculo com uma compra.</Alert>)}
            {invoice?.id ? (!editingInstallment && <Box sx={{ mt: 1 }}>{monthlyFixedOption}</Box>) : <InstallmentOptions
              checked={installmentPurchase} count={installmentCount} value={formExpense.values.value}
              disabled={loadingButton} onCheckedChange={setInstallmentPurchase} onCountChange={setInstallmentCount}
            >
              {!installmentPurchase && monthlyFixedOption}
            </InstallmentOptions>}
          </TransactionFormSection>
        </TabPanel>

        <TabPanel value={tabSelected} index={1}>
          <TransactionFormSection
            form={formRevenue}
            onSubmit={formRevenue.handleSubmit}
            dialogContentSx={{ pt: 3, pb: 1 }}
            stackSpacing={2}
            categoryOptions={revenueCategoryOptions}
            categoryValue={formRevenue.values.revenueCategory}
            onCategoryChange={(value) => formRevenue.setFieldValue('revenueCategory', value)}
            groupBy={revenueGroupBy}
            loading={loadingButton}
            submitLabel={revenue?.id ? 'Atualizar receita' : 'Lançar receita'}
            submitIcon={revenue?.id ? null : <AddRoundedIcon />}
            valueInputRef={revenueValueInput}
            autoFocusValue={!invoice?.id && !revenue?.id}
            handleClose={closeWhenIdle}
            secondaryActionSx={secondaryActionSx}
            primaryActionSx={primaryActionSx}
          />
        </TabPanel>
      </div>
    </Dialog>
  );
};
