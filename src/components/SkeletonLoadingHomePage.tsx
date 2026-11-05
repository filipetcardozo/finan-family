import React from 'react';
import { Box, Card, CardContent, Divider, Skeleton, Stack } from '@mui/material';

export const LoadingHomePage = () => {
  const cardStyle = {
    borderRadius: 4,
    borderColor: 'var(--border)',
    boxShadow: 'var(--shadow)',
  };

  return (
    <Box
      sx={{
        px: { xs: 0.2, sm: 0.4 },
        py: 0.5,
      }}
    >
      <Stack spacing={2.5}>
        <Card
          variant='outlined'
          sx={{
            borderRadius: 4,
            background: 'var(--hero)',
            border: 'none',
            boxShadow: 'var(--shadow)',
          }}
        >
          <CardContent sx={{ p: { xs: 2.4, sm: 3 } }}>
            <Stack spacing={1.4}>
              <Stack direction='row' justifyContent='space-between' alignItems='center'>
                <Box>
                  <Skeleton variant='text' width={130} sx={{ bgcolor: 'rgba(236, 252, 255, 0.45)' }} />
                  <Skeleton variant='text' width={190} height={44} sx={{ mt: 0.3, bgcolor: 'rgba(236, 252, 255, 0.55)' }} />
                </Box>
              </Stack>

              <Skeleton variant='text' width={145} sx={{ bgcolor: 'rgba(236, 252, 255, 0.45)' }} />
              <Skeleton variant='text' width={220} height={56} sx={{ bgcolor: 'rgba(236, 252, 255, 0.58)' }} />
              <Skeleton variant='rounded' width={180} height={38} sx={{ borderRadius: 10, bgcolor: 'rgba(236, 252, 255, 0.5)' }} />
            </Stack>
          </CardContent>
        </Card>

        <Card variant='outlined' sx={cardStyle}>
          <CardContent sx={{ p: { xs: 2.2, sm: 2.6 } }}>
            <Stack spacing={1.1}>
              <Stack direction='row' justifyContent='space-between' alignItems='center'>
                <Skeleton variant='text' width={170} height={28} />
                <Skeleton variant='text' width={48} height={28} />
              </Stack>
              <Skeleton variant='rounded' height={10} sx={{ borderRadius: 8 }} />
              <Skeleton variant='text' width='72%' />
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
          {[1, 2, 3, 4].map(item => (
            <Card key={item} variant='outlined' sx={cardStyle}>
              <CardContent sx={{ p: 2.5 }}>
                <Stack spacing={0.8}>
                  <Skeleton variant='text' width='44%' />
                  <Skeleton variant='text' width='62%' height={38} />
                  <Skeleton variant='text' width='70%' />
                </Stack>
              </CardContent>
            </Card>
          ))}
        </Box>

        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2 }}>
          {[1, 2].map(item => (
            <Card key={item} variant='outlined' sx={cardStyle}>
              <CardContent sx={{ p: { xs: 2, sm: 2.4 } }}>
                <Skeleton variant='text' width='65%' height={28} sx={{ mb: 2 }} />
                <Skeleton variant='rounded' height={260} sx={{ borderRadius: 3 }} />
              </CardContent>
            </Card>
          ))}
        </Box>

        <Divider sx={{ borderColor: 'var(--border)' }} />

        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', md: '1.15fr 1fr' },
            alignItems: 'start',
            gap: 2,
          }}
        >
          <Card variant='outlined' sx={cardStyle}>
            <CardContent sx={{ p: { xs: 2, sm: 2.4 } }}>
              <Stack direction='row' spacing={1.2} alignItems='center'>
                <Skeleton variant='rounded' width={40} height={40} sx={{ borderRadius: 2.5 }} />
                <Box sx={{ flex: 1 }}>
                  <Skeleton variant='text' width={150} height={28} />
                  <Skeleton variant='text' width={110} />
                </Box>
              </Stack>
              <Stack spacing={2.5} sx={{ mt: 2.5 }}>
                {[1, 2, 3].map(item => (
                  <Stack key={item} direction='row' spacing={1.5}>
                    <Skeleton variant='circular' width={34} height={34} sx={{ flexShrink: 0 }} />
                    <Box sx={{ flex: 1 }}>
                      <Skeleton variant='text' width='60%' sx={{ mb: 1 }} />
                      <Skeleton variant='rounded' height={120} sx={{ borderRadius: 3 }} />
                    </Box>
                  </Stack>
                ))}
              </Stack>
            </CardContent>
          </Card>

          <Card variant='outlined' sx={cardStyle}>
            <CardContent sx={{ p: { xs: 2, sm: 2.4 } }}>
              <Skeleton variant='text' width={190} height={30} />
              <Skeleton variant='text' width='75%' />
              <Box sx={{ mt: 1.2, display: 'flex', justifyContent: 'center' }}>
                <Skeleton variant='circular' width={180} height={180} />
              </Box>
            </CardContent>
          </Card>
        </Box>
      </Stack>
    </Box>
  );
};
