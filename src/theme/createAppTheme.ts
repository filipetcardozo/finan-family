import { createTheme } from '@mui/material/styles';
import { palettes, type ColorMode } from './palette';

export function createAppTheme(mode: ColorMode, fontFamily = 'Manrope, system-ui, Arial, sans-serif') {
  const colors = palettes[mode];
  return createTheme({
    palette: {
      mode,
      primary: { main: colors.primary, dark: colors.primaryDark, light: colors.secondary, contrastText: colors.actionText },
      secondary: { main: colors.secondary, light: colors.accent, dark: colors.primaryDark, contrastText: colors.actionText },
      success: { main: '#10b981', dark: '#047857', light: '#34d399' },
      warning: { main: '#f59e0b' }, error: { main: '#ef4444' }, info: { main: '#0ea5e9' },
      background: { default: colors.background, paper: colors.surface },
      text: { primary: colors.text, secondary: colors.muted }, divider: colors.border,
    },
    typography: { fontFamily, fontSize: 16, button: { textTransform: 'none' } },
    components: {
      MuiCssBaseline: { styleOverrides: {
        body: { backgroundColor: 'var(--background)', color: 'var(--text)' },
        '::selection': { backgroundColor: 'var(--primary-soft)', color: 'var(--primary-text)' },
      } },
      MuiPaper: { styleOverrides: { root: { backgroundImage: 'none', backgroundColor: 'var(--surface)', color: 'var(--text)' } } },
      MuiCard: { styleOverrides: { root: { borderColor: 'var(--border)', boxShadow: 'var(--shadow)' } } },
      MuiDialog: { styleOverrides: { paper: { backgroundColor: 'var(--surface)' } } },
      MuiOutlinedInput: { styleOverrides: { root: {
        color: 'var(--text)',
        '& .MuiOutlinedInput-notchedOutline': { borderColor: 'var(--border)' },
        '&:hover:not(.Mui-disabled):not(.Mui-error) .MuiOutlinedInput-notchedOutline': { borderColor: 'var(--primary)' },
        '& select option, & select optgroup': { backgroundColor: 'var(--surface)', color: 'var(--text)' },
      } } },
      MuiButton: { styleOverrides: {
        containedPrimary: { background: 'var(--action)', color: 'var(--action-text)', '&:hover': { background: 'var(--action-hover)' } },
      } },
      MuiTooltip: { styleOverrides: { tooltip: { backgroundColor: mode === 'dark' ? '#e2e8f0' : '#0f172a', color: mode === 'dark' ? '#0f172a' : '#ffffff' } } },
      MuiSkeleton: { styleOverrides: { root: { backgroundColor: 'var(--border)' } } },
    },
  });
}
