import * as React from 'react';
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
import { IInvoice } from '../../providers/invoices/types';
import dayjs, { Dayjs } from 'dayjs';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { MobileDatePicker } from '@mui/x-date-pickers/MobileDatePicker';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import 'dayjs/locale/pt-br';
import { useAuth } from '../../hooks/auth/useAuth';
import { putInvoice, updateInvoice } from '../../providers/invoices/services';
import LoadingButton from '@mui/lab/LoadingButton';
import { useSnackbar } from 'notistack';
import { CurrencyInput } from '../common/currencyInput';

interface IProps {
  open: boolean,
  handleClose(): void;
  invoice?: IInvoice;
  handleUpdateInvoice?(newInvoice: IInvoice): void
}

export const AddInvoiceModal = ({ open, handleClose, invoice, handleUpdateInvoice }: IProps) => {
  const { uid } = useAuth()
  const { enqueueSnackbar } = useSnackbar();

  const initialValuesForm = {
    addDate: dayjs(new Date()),
    addMonth: new Date().getMonth(),
    description: '',
    invoiceCategory: '',
    value: undefined,
    userId: '',
    id: ''
  };

  React.useEffect(() => {
    if (invoice && invoice.id) {
      form.setFieldValue('addDate', invoice.addDate);
      form.setFieldValue('addMonth', invoice.addMonth);
      form.setFieldValue('description', invoice.description);
      form.setFieldValue('invoiceCategory', invoice.invoiceCategory);
      form.setFieldValue('value', invoice.value);
      form.setFieldValue('userId', invoice.userId);
      form.setFieldValue('id', invoice.id);
    }
  }, [invoice]);

  const [loadingButton, setLoadingButton] = React.useState(false);
  const form = useFormik({
    initialValues: initialValuesForm,
    onSubmit: async values => {
      setLoadingButton(true);

      if (invoice && invoice.id) {
        await updateInvoice({ ...form.values })
          .then(() => {
            enqueueSnackbar('Despesa alterada', { autoHideDuration: 2000, variant: 'success', anchorOrigin: { horizontal: 'center', vertical: 'top' } });
            if (handleUpdateInvoice) {
              handleUpdateInvoice({ ...form.values });
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
            form.resetForm();
            form.setFieldValue('value', 0);
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

  return <Dialog open={open} onClose={handleClose} fullWidth >
    <DialogTitle>
      {invoice && invoice.id ? 'Alterar despesa' : 'Inserir despesa'}
    </DialogTitle>
    <form onSubmit={form.handleSubmit}>
      <DialogContent>
        <FormControl fullWidth margin='normal' size='small'>
          <InputLabel id="invoice-category-label">Categoria</InputLabel>
          <Select
            label='Categoria' labelId="invoice-category-label"
            name='invoiceCategory' id="invoiceCategory"
            onChange={form.handleChange}
            value={form.values.invoiceCategory}
            variant='outlined' size='small' type='text'
          >
            <MenuItem value='Alimentação'>Alimentação</MenuItem>
            <MenuItem value='Contas'>Contas</MenuItem>
            <MenuItem value='Combustível'>Combustível</MenuItem>
            <MenuItem value='Casa'>Casa</MenuItem>
            <MenuItem value='Entretenimento'>Entretenimento</MenuItem>
            <MenuItem value='Restaurante'>Restaurante</MenuItem>
            <MenuItem value='Roupas'>Roupas</MenuItem>
            <MenuItem value='Pets'>Pets</MenuItem>
            <MenuItem value='Manutenção carro'>Manutenção carro</MenuItem>
            <MenuItem value='Faculdade'>Faculdade</MenuItem>
            <MenuItem value='Telefone'>Telefone</MenuItem>
            <MenuItem value='Saúde'>Saúde</MenuItem>
            <MenuItem value='Esportes'>Esportes</MenuItem>
          </Select>
        </FormControl>
        <CurrencyInput nameOfKeyValue='value' form={form} />
        <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale='pt-BR'>
          <MobileDatePicker
            label="Data"
            value={form.values.addDate}
            onChange={(v) => {
              form.setFieldValue('addDate', v)
              form.setFieldValue('addMonth', v?.month())
            }}
            renderInput={(params) => <TextField
              {...params}
              size='small'
              margin='normal'
              name='addDate'
              fullWidth
            />
            }
          />
        </LocalizationProvider>
        <TextField
          label='Descrição' name='description' id='description'
          onChange={form.handleChange}
          value={form.values.description}
          variant="outlined" size='small' margin='normal'
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
  </Dialog>
}