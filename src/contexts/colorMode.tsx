import React, { createContext, useCallback, useContext, useEffect, useLayoutEffect, useMemo, useState } from 'react';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { COLOR_MODE_KEY, parseColorPreference, resolveColorMode, type ColorMode, type ColorPreference } from '../theme/palette';
import { createAppTheme } from '../theme/createAppTheme';

const ColorModeContext = createContext({ mode: 'light' as ColorMode, preference: 'system' as ColorPreference,
  toggleMode: () => {}, setPreference: (_preference: ColorPreference) => {} });
export const useColorMode = () => useContext(ColorModeContext);
const useClientLayoutEffect = typeof window === 'undefined' ? useEffect : useLayoutEffect;

export function ColorModeProvider({ children, fontFamily }: { children: React.ReactNode; fontFamily: string }) {
  const [preference, setStoredPreference] = useState<ColorPreference>('system');
  const [systemDark, setSystemDark] = useState(false);
  const [ready, setReady] = useState(false);
  const mode = resolveColorMode(preference, systemDark);

  useClientLayoutEffect(() => {
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    setSystemDark(media.matches);
    try { setStoredPreference(parseColorPreference(localStorage.getItem(COLOR_MODE_KEY))); } catch {}
    setReady(true);
    const changed = () => setSystemDark(media.matches);
    const stored = (event: StorageEvent) => {
      if (event.key === COLOR_MODE_KEY || event.key === null) setStoredPreference(parseColorPreference(event.newValue));
    };
    if (media.addEventListener) media.addEventListener('change', changed);
    else media.addListener(changed);
    window.addEventListener('storage', stored);
    return () => {
      if (media.removeEventListener) media.removeEventListener('change', changed);
      else media.removeListener(changed);
      window.removeEventListener('storage', stored);
    };
  }, []);

  useClientLayoutEffect(() => {
    if (!ready) return;
    document.documentElement.dataset.theme = mode;
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', mode === 'dark' ? '#0f172a' : '#15803d');
  }, [mode, ready]);

  const setPreference = useCallback((value: ColorPreference) => {
    setStoredPreference(value);
    try {
      if (value === 'system') localStorage.removeItem(COLOR_MODE_KEY);
      else localStorage.setItem(COLOR_MODE_KEY, value);
    } catch { /* Manual switching still works if storage is blocked. */ }
  }, []);
  const toggleMode = useCallback(() => setPreference(mode === 'dark' ? 'light' : 'dark'), [mode, setPreference]);
  const theme = useMemo(() => createAppTheme(mode, fontFamily), [mode, fontFamily]);
  return <ColorModeContext.Provider value={{ mode, preference, setPreference, toggleMode }}>
    <ThemeProvider theme={theme}><CssBaseline />{children}</ThemeProvider>
  </ColorModeContext.Provider>;
}
