import { Alert, Button } from '@mui/material';
import CloudOffRoundedIcon from '@mui/icons-material/CloudOffRounded';
import CloudUploadRoundedIcon from '@mui/icons-material/CloudUploadRounded';
import { useSnackbar } from 'notistack';
import { useOfflineSync } from '../contexts/offlineSync';

export function OfflineSyncStatus() {
  const { launches, online, syncing, storageError, retry } = useOfflineSync();
  const { enqueueSnackbar } = useSnackbar();
  const count = launches.reduce((total, launch) => total + launch.documents.length, 0);
  const error = launches.find(launch => launch.error)?.error;
  if (online && !count && !storageError) return null;
  const pending = `${count} ${count === 1 ? 'lançamento pendente' : 'lançamentos pendentes'}`;
  return <Alert
    severity={storageError || error ? 'warning' : 'info'}
    icon={online ? <CloudUploadRoundedIcon fontSize='small' /> : <CloudOffRoundedIcon fontSize='small' />}
    role='status'
    action={online && count > 0 && !syncing ? <Button color='inherit' size='small' onClick={() => {
      void retry().catch(() => enqueueSnackbar('Não foi possível acessar as pendências.', { variant: 'error' }));
    }}>Tentar novamente</Button> : undefined}
    sx={{ mx: { xs: 1.3, sm: 2 }, mb: 2, borderRadius: 2, fontSize: 12, alignItems: 'center' }}
  >
    {storageError || (error ? `${pending}. ${error}` : !online ? `Sem conexão${count ? ` · ${pending}` : ''}`
      : syncing ? `Sincronizando · ${pending}` : pending)}
  </Alert>;
}
