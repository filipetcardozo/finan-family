import React from 'react';
import { Box, Card, CardContent, Divider, Skeleton, Stack } from '@mui/material';

export const LoadingHomePage = () => {
  const cardStyle = {
    borderRadius: 4,
    borderColor: 'rgba(6, 42, 63, 0.10)',
    boxShadow: '0 18px 30px -26px rgba(6, 42, 63, 0.5)',
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
            background: 'linear-gradient(136deg, #082b43 0%, #0f6a72 48%, #15917c 100%)',
            border: 'none',
            boxShadow: '0 24px 45px -30px rgba(3, 35, 56, 0.7)',
          }}
        >
          <CardContent sx={{ p: { xs: 2.4, sm: 3 } }}>
            <Stack spacing={1.4}>
              <Stack direction='row' justifyContent='space-between' alignItems='center'>
                <Box>
                  <Skeleton variant='text' width={130} sx={{ bgcolor: 'rgba(236, 252, 255, 0.45)' }} />
                  <Skeleton variant='text' width={190} height={44} sx={{ mt: 0.3, bgcolor: 'rgba(236, 252, 255, 0.55)' }} />
                </Box>
                <Skeleton
                  variant='rounded'
                  width={120}
                  height={32}
                  sx={{ borderRadius: 12, bgcolor: 'rgba(236, 252, 255, 0.45)' }}
                />
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

        <Divider sx={{ borderColor: 'rgba(16, 36, 53, 0.1)' }} />

        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', md: '1.05fr 1fr' },
            gap: 2,
          }}
        >
          <Card variant='outlined' sx={cardStyle}>
            <CardContent sx={{ p: { xs: 2, sm: 2.4 } }}>
              <Skeleton variant='text' width={150} height={30} />
              <Skeleton variant='text' width='60%' />
              <Stack spacing={1} sx={{ mt: 1.2 }}>
                {[1, 2, 3].map(item => (
                  <Skeleton key={item} variant='rounded' height={38} sx={{ borderRadius: 2.5 }} />
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
