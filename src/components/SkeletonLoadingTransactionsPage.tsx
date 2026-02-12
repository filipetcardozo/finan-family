import React from 'react';
import { Box, Card, CardContent, Chip, Skeleton, Stack, TextField, Typography } from '@mui/material';

interface Props {
  type: 'expenses' | 'revenues';
}

export const LoadingTransactionsPage: React.FC<Props> = ({ type }) => {
  const title = type === 'expenses' ? 'Despesas' : 'Receitas';

  return (
    <Box
      sx={{
        maxWidth: 1080,
        mx: 'auto',
        px: { xs: 1.3, sm: 2 },
        width: '100%',
      }}
    >
      <Stack spacing={2}>
        <Card
          sx={{
            borderRadius: 4,
            border: '1px solid rgba(6, 42, 63, 0.08)',
            background: 'linear-gradient(136deg, #082b43 0%, #0f6a72 48%, #15917c 100%)',
            color: '#eefcff',
          }}
        >
          <CardContent sx={{ p: { xs: 2, sm: 2.5 } }}>
            <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent='space-between' spacing={1.3}>
              <Box>
                <Typography sx={{ opacity: 0.88, fontSize: 13 }}>Carregando visão mensal</Typography>
                <Typography sx={{ fontWeight: 700, fontSize: { xs: 24, sm: 28 }, lineHeight: 1.15 }}>
                  {title}
                </Typography>
              </Box>
              <Chip
                label={<Skeleton variant='text' width={110} sx={{ bgcolor: 'rgba(213, 248, 255, .35)' }} />}
                sx={{
                  color: '#d5f8ff',
                  borderColor: 'rgba(213, 248, 255, .45)',
                  backgroundColor: 'rgba(213, 248, 255, .12)',
                  maxWidth: 'fit-content',
                  '& .MuiChip-label': { px: 0.7, py: 0.5 },
                }}
                variant='outlined'
              />
            </Stack>
          </CardContent>
        </Card>

        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, minmax(0, 1fr))' },
            gap: 2,
          }}
        >
          {[1, 2].map(item => (
            <Card
              key={item}
              variant='outlined'
              sx={{
                borderRadius: 4,
                borderColor: 'rgba(6, 42, 63, 0.10)',
                boxShadow: '0 18px 30px -26px rgba(6, 42, 63, 0.5)',
              }}
            >
              <CardContent sx={{ p: 2.5 }}>
                <Stack direction='row' justifyContent='space-between' alignItems='center'>
                  <Box sx={{ width: '100%' }}>
                    <Skeleton variant='text' width='42%' />
                    <Skeleton variant='text' width='58%' height={42} />
                    <Skeleton variant='text' width='36%' />
                  </Box>
                  <Skeleton variant='circular' width={28} height={28} />
                </Stack>
              </CardContent>
            </Card>
          ))}
        </Box>

        <Card
          variant='outlined'
          sx={{
            borderRadius: 4,
            borderColor: 'rgba(6, 42, 63, 0.10)',
            boxShadow: '0 18px 30px -26px rgba(6, 42, 63, 0.5)',
          }}
        >
          <CardContent sx={{ p: { xs: 1.2, sm: 1.8 } }}>
            <Stack spacing={1.2}>
              <TextField size='small' label='Buscar' disabled fullWidth />

              <Box
                sx={{
                  border: '1px solid rgba(16, 50, 72, 0.12)',
                  borderRadius: 3,
                  overflow: 'hidden',
                  backgroundColor: '#fff',
                }}
              >
                <Box sx={{ px: 1.4, py: 1.1, backgroundColor: '#eef8fc', borderBottom: '1px solid rgba(16, 50, 72, 0.12)' }}>
                  <Skeleton variant='text' width='45%' />
                </Box>

                <Stack spacing={0} sx={{ p: 1 }}>
                  {[1, 2, 3, 4, 5, 6].map(item => (
                    <Box
                      key={item}
                      sx={{
                        py: 1.2,
                        px: 0.8,
                        borderBottom: item < 6 ? '1px solid rgba(16, 50, 72, 0.08)' : 'none',
                      }}
                    >
                      <Skeleton variant='text' width={`${70 - item * 5}%`} />
                    </Box>
                  ))}
                </Stack>
              </Box>
            </Stack>
          </CardContent>
        </Card>
      </Stack>
    </Box>
  );
};
