import React from 'react';
import { Box, Stack, Typography } from '@mui/material';

interface Props {
  size?: number;
  inverse?: boolean;
  showName?: boolean;
}

export function BrandLogo({ size = 32, inverse = false, showName = false }: Props) {
  return (
    <Stack direction='row' alignItems='center' spacing={1.25} sx={{ color: inverse ? '#ffffff' : 'var(--text)' }}>
      <Box
        component='svg'
        viewBox='0 0 64 48'
        role={showName ? undefined : 'img'}
        aria-label={showName ? undefined : 'Finan Family'}
        aria-hidden={showName || undefined}
        width={size}
        height={size * 0.75}
        sx={{ display: 'block', flexShrink: 0, fill: 'currentColor', color: inverse ? 'var(--nav-text)' : 'var(--primary)' }}
      >
        <path d='M5 44C2.24 44 0 41.76 0 39V27C0 16 8 9 25 2C27.2 1.1 30 2.7 30 5.2V8C30 10.6 28.8 12.9 26.7 14.4C18.8 20.2 16 24.6 16 30V39C16 41.76 13.76 44 11 44Z' />
        <path d='M5 44C2.24 44 0 41.76 0 39V27C0 16 8 9 25 2C27.2 1.1 30 2.7 30 5.2V8C30 10.6 28.8 12.9 26.7 14.4C18.8 20.2 16 24.6 16 30V39C16 41.76 13.76 44 11 44Z' transform='translate(64 0) scale(-1 1)' />
      </Box>
      {showName && <Typography sx={{ fontSize: 20, fontWeight: 600, letterSpacing: '-0.035em', whiteSpace: 'nowrap' }}>Finan Family</Typography>}
    </Stack>
  );
}
