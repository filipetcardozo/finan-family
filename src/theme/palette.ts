export type ColorMode = 'light' | 'dark';
export type ColorPreference = ColorMode | 'system';
export const COLOR_MODE_KEY = 'finan-family-color-mode';

export const palettes = {
  light: {
    primary: '#16a34a', primaryDark: '#15803d', secondary: '#22c55e', accent: '#86efac',
    background: '#f8fafc', surface: '#ffffff', subtle: '#f1f5f9', elevated: '#ffffff',
    text: '#0f172a', muted: '#64748b', border: '#e2e8f0',
    primaryText: '#15803d', primarySoft: '#e8f8ed', secondaryText: '#166534', secondarySoft: '#dcfce7',
    action: '#15803d', actionHover: '#166534', actionText: '#ffffff',
    incomeText: '#047857', incomeSoft: '#d1fae5', expenseText: '#dc2626', expenseSoft: '#fee2e2',
    nav: 'linear-gradient(120deg, #052e16 0%, #166534 48%, #15803d 100%)', navText: '#ffffff', navMuted: '#dcfce7',
    navSelected: 'rgba(255,255,255,.18)', hero: 'linear-gradient(125deg, #14532d 0%, #15803d 52%, #16a34a 100%)',
    fab: 'linear-gradient(135deg, #14532d 0%, #15803d 45%, #16a34a 100%)',
    fabHover: 'linear-gradient(135deg, #166534, #16a34a)',
    heroText: '#ffffff', heroAccent: '#dcfce7', heroAccentText: '#14532d',
    heroSuccess: '#dcfce7', heroWarning: '#fef3c7', heroError: '#fee2e2',
    track: '#e2f3e8', shadow: '0 12px 28px -20px rgba(15,23,42,.24)',
    chartLabel: '#ffffff',
    charts: ['#15803d', '#047857', '#0f766e', '#0369a1', '#4f46e5', '#a16207', '#b45309', '#be185d'],
  },
  dark: {
    primary: '#0ea5e9', primaryDark: '#0284c7', secondary: '#38bdf8', accent: '#7dd3fc',
    background: '#0f172a', surface: '#1e293b', subtle: '#263448', elevated: '#253349',
    text: '#f8fafc', muted: '#a8b8cd', border: '#334155',
    primaryText: '#7dd3fc', primarySoft: '#12384a', secondaryText: '#bae6fd', secondarySoft: '#16445c',
    action: '#0ea5e9', actionHover: '#38bdf8', actionText: '#082f49',
    incomeText: '#34d399', incomeSoft: '#163e3e', expenseText: '#f87171', expenseSoft: '#492d39',
    nav: 'linear-gradient(135deg, #172334, #1e293b)', navText: '#f8fafc', navMuted: '#cbd5e1',
    navSelected: '#334b67', hero: 'linear-gradient(125deg, #071c2c, #075985)',
    fab: 'linear-gradient(135deg, #0284c7 0%, #0ea5e9 50%, #38bdf8 100%)',
    fabHover: 'linear-gradient(135deg, #0ea5e9, #7dd3fc)',
    heroText: '#f8fafc', heroAccent: '#a5e7fc', heroAccentText: '#082f49',
    heroSuccess: '#a5f3fc', heroWarning: '#fde68a', heroError: '#fecaca',
    track: '#334155', shadow: '0 12px 28px -20px rgba(0,0,0,.65)',
    chartLabel: '#0f172a',
    charts: ['#38bdf8', '#34d399', '#a78bfa', '#fbbf24', '#fb923c', '#f472b6', '#2dd4bf', '#94a3b8'],
  },
} as const;

export function parseColorPreference(value: unknown): ColorPreference {
  return value === 'light' || value === 'dark' ? value : 'system';
}

export function resolveColorMode(preference: ColorPreference, systemDark: boolean): ColorMode {
  return preference === 'system' ? (systemDark ? 'dark' : 'light') : preference;
}

const cssNames: Record<string, string> = {
  primaryDark: 'primary-dark', primaryText: 'primary-text', primarySoft: 'primary-soft',
  secondaryText: 'secondary-text', secondarySoft: 'secondary-soft',
  actionHover: 'action-hover', actionText: 'action-text', incomeText: 'income-text', incomeSoft: 'income-soft',
  expenseText: 'expense-text', expenseSoft: 'expense-soft', navText: 'nav-text', navMuted: 'nav-muted', navSelected: 'nav-selected',
  heroText: 'hero-text', heroAccent: 'hero-accent', heroAccentText: 'hero-accent-text', chartLabel: 'chart-label',
  heroSuccess: 'hero-success', heroWarning: 'hero-warning', heroError: 'hero-error',
  fabHover: 'fab-hover',
};
const variables = (mode: ColorMode) => Object.entries(palettes[mode]).map(([key, value]) => key === 'charts'
  ? (value as readonly string[]).map((color, index) => `--chart-${index}:${color}`).join(';')
  : `--${cssNames[key] ?? key}:${value}`).join(';');

// Also available before React hydrates, including the first visit in a dark OS.
export const colorModeCss = `:root{${variables('light')};color-scheme:light}
@media(prefers-color-scheme:dark){:root:not([data-theme="light"]){${variables('dark')};color-scheme:dark}}
:root[data-theme="dark"]{${variables('dark')};color-scheme:dark}
html,body{background:var(--background);color:var(--text)}`;

export const colorModeInitScript = `(function(){var p='system';try{p=localStorage.getItem('${COLOR_MODE_KEY}')||'system'}catch(e){}var d=p==='dark'||(p!=='light'&&window.matchMedia&&window.matchMedia('(prefers-color-scheme: dark)').matches);document.documentElement.dataset.theme=d?'dark':'light'})()`;
