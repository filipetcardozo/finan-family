const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
require.extensions['.ts'] = (module, filename) => module._compile(ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, esModuleInterop: true, target: ts.ScriptTarget.ES2020 },
}).outputText, filename);
const { palettes, parseColorPreference, resolveColorMode, colorModeInitScript, colorModeCss } = require('../src/theme/palette.ts');
const { createAppTheme } = require('../src/theme/createAppTheme.ts');

test('uses the supplied green and Slate palettes, including semantic feedback colors', () => {
  assert.equal(palettes.light.primary, '#16a34a');
  assert.equal(palettes.light.primaryDark, '#15803d');
  assert.equal(palettes.light.secondary, '#22c55e');
  assert.equal(palettes.light.accent, '#86efac');
  assert.equal(palettes.light.background, '#f8fafc');
  assert.equal(palettes.dark.primary, '#0ea5e9');
  assert.equal(palettes.dark.primaryDark, '#0284c7');
  assert.equal(palettes.dark.secondary, '#38bdf8');
  assert.equal(palettes.dark.accent, '#7dd3fc');
  assert.equal(palettes.dark.background, '#0f172a');
  for (const mode of ['light', 'dark']) {
    const theme = createAppTheme(mode);
    assert.equal(theme.palette.mode, mode);
    assert.equal(theme.palette.background.paper, palettes[mode].surface);
    assert.equal(theme.palette.success.main, '#10b981');
    assert.equal(theme.palette.warning.main, '#f59e0b');
    assert.equal(theme.palette.error.main, '#ef4444');
    assert.ok(theme.palette.getContrastText(theme.palette.background.paper));
  }
});

test('follows the OS by default while an explicit preference overrides OS changes', () => {
  for (const value of [null, undefined, '', 'unknown', 'system']) {
    assert.equal(parseColorPreference(value), 'system');
    assert.equal(resolveColorMode(parseColorPreference(value), true), 'dark');
    assert.equal(resolveColorMode(parseColorPreference(value), false), 'light');
  }
  assert.equal(resolveColorMode(parseColorPreference('light'), true), 'light');
  assert.equal(resolveColorMode(parseColorPreference('dark'), false), 'dark');
});

test('applies the correct mode before hydration, including when local storage is blocked', () => {
  for (const [saved, systemDark, expected] of [[null, true, 'dark'], [null, false, 'light'], ['light', true, 'light'], ['dark', false, 'dark'], ['invalid', true, 'dark']]) {
    const document = { documentElement: { dataset: {} } };
    vm.runInNewContext(colorModeInitScript, { document, localStorage: { getItem: () => saved }, window: { matchMedia: () => ({ matches: systemDark }) } });
    assert.equal(document.documentElement.dataset.theme, expected);
  }
  const document = { documentElement: { dataset: {} } };
  vm.runInNewContext(colorModeInitScript, { document, localStorage: { getItem() { throw new Error('blocked'); } }, window: { matchMedia: () => ({ matches: true }) } });
  assert.equal(document.documentElement.dataset.theme, 'dark');
  assert.match(colorModeCss, /prefers-color-scheme:dark/);
});

test('every static semantic CSS token used by components has a definition', () => {
  const path = require('node:path');
  const used = new Set();
  const visit = dir => fs.readdirSync(dir, { withFileTypes: true }).forEach(entry => {
    const file = path.join(dir, entry.name);
    if (entry.isDirectory()) visit(file);
    else if (/\.(ts|tsx)$/.test(file)) for (const match of fs.readFileSync(file, 'utf8').matchAll(/var\((--[a-z-]+)\)/g)) used.add(match[1]);
  });
  visit(path.resolve(__dirname, '../src'));
  for (const token of used) assert.ok(colorModeCss.includes(`${token}:`), `Missing theme token ${token}`);
});
