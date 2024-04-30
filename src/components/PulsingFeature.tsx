import { styled } from '@mui/material';

export const PulsingFeature = styled('div')(({ theme }) => ({
  animation: 'pulse 2s infinite',
  fontWeight: 'bold',
  color: theme.palette.secondary.main,
  '@keyframes pulse': {
    '0%': {
      transform: 'scale(1)',
      opacity: 1,
    },
    '50%': {
      transform: 'scale(1.3)',
      opacity: 0.7,
    },
    '100%': {
      transform: 'scale(1)',
      opacity: 1,
    },
  },
}));