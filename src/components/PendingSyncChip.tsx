import { Chip, Tooltip } from '@mui/material';
import CloudUploadRoundedIcon from '@mui/icons-material/CloudUploadRounded';

export function PendingSyncChip() {
  return <Tooltip title='Salvo neste dispositivo. Aguardando envio.'>
    <Chip label='Pendente' icon={<CloudUploadRoundedIcon />} size='small'
      sx={{ height: 22, fontSize: 10, fontWeight: 500, bgcolor: 'var(--subtle)', color: 'text.secondary', '& .MuiChip-icon': { fontSize: 14, color: 'inherit' } }} />
  </Tooltip>;
}
