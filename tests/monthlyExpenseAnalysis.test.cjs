const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
const dayjs = require('dayjs');
const React = require('react');
const { renderToStaticMarkup } = require('react-dom/server');

require.extensions['.ts'] = require.extensions['.tsx'] = (module, filename) => module._compile(ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, esModuleInterop: true, target: ts.ScriptTarget.ES2020, jsx: ts.JsxEmit.ReactJSX },
}).outputText, filename);
const { buildMonthlyExpenseAnalysis } = require('../src/utils/monthlyExpenseAnalysis.ts');
const { MonthlyExpenseCharts } = require('../src/components/MonthlyExpenseCharts.tsx');
const month = dayjs('2026-11-01');
const expense = (value, extra = {}) => ({
  id: 'expense', userId: 'family', value, invoiceCategory: 'Contas', description: '',
  addDate: dayjs('2026-11-05'), addDateFormatted: '11/2026', ...extra,
});

test('separates monthly obligations from daily spending without double-counting installments marked fixed', () => {
  const result = buildMonthlyExpenseAnalysis([
    expense(100, { isMonthlyFixed: true }),
    expense(50, { isMonthlyFixed: true, installmentNumber: 1, installmentCount: 3 }),
    expense(30), expense(20),
  ], month, month.endOf('month'));
  assert.equal(result.total, 200);
  assert.deepEqual(result.groups.map(group => group.value), [100, 50, 50]);
  assert.deepEqual(result.groups.map(group => group.percentage), [50, 25, 25]);
  assert.deepEqual(result.groups.map(group => group.count), [1, 1, 2]);
  assert.equal(result.days[4].value, 50);
  assert.equal(result.days[4].count, 2);
  assert.equal(result.days.length, 30);
});

test('uses only the selected month, excludes investments and invalid values, and keeps exact cent totals', () => {
  const result = buildMonthlyExpenseAnalysis([
    expense(0.1), expense(0.2), expense(100, { invoiceCategory: ' Investimentos ' }),
    expense(200, { addDate: dayjs('2026-10-05') }), expense(300, { addDate: null }),
    expense(NaN), expense(undefined), expense(-10),
  ], month);
  assert.equal(result.total, 0.3);
  assert.equal(result.days[4].value, 0.3);
  assert.equal(result.groups[2].percentage, 100);
  assert.equal(buildMonthlyExpenseAnalysis([], dayjs('2028-02-01')).days.length, 29);
});

test('recognizes older installments and handles a month with no daily spending', () => {
  const result = buildMonthlyExpenseAnalysis([expense(45, { description: 'Consulta · Parcela 2/5' })], month);
  assert.equal(result.groups[1].value, 45);
  assert.ok(result.days.every(day => day.value === 0));
  const empty = buildMonthlyExpenseAnalysis([], month);
  assert.equal(empty.total, 0);
  assert.ok(empty.groups.every(group => group.percentage === 0));
});

test('hidden charts render no financial totals, ratios or populated chart data', () => {
  const expenses = [expense(1234.56, { isMonthlyFixed: true })];
  const hidden = renderToStaticMarkup(React.createElement(MonthlyExpenseCharts, { expenses, month, showValues: false }));
  assert.equal((hidden.match(/>Valores ocultos</g) || []).length, 2);
  assert.doesNotMatch(hidden, /1\.234,56|1234\.56|100\.0%|recharts-wrapper/);
  const shown = renderToStaticMarkup(React.createElement(MonthlyExpenseCharts, { expenses, month, showValues: true }));
  assert.match(shown, /1\.234,56/);
  assert.match(shown, /Nenhuma despesa avulsa/);
});

test('the current month ends on today while future expenses remain in the monthly composition', () => {
  const result = buildMonthlyExpenseAnalysis([
    expense(20), expense(60, { addDate: dayjs('2026-11-15') }),
  ], month, dayjs('2026-11-05'));
  assert.deepEqual(result.days.map(day => day.day), [1, 2, 3, 4, 5]);
  assert.equal(result.days[4].value, 20);
  assert.equal(result.total, 80);
  assert.equal(result.groups[2].value, 80);
  assert.equal(buildMonthlyExpenseAnalysis([], month, dayjs('2026-11-01')).days.length, 1);
});

test('past months, year boundaries and the last day of the current month include every calendar day', () => {
  assert.equal(buildMonthlyExpenseAnalysis([], month, dayjs('2026-11-30')).days.length, 30);
  assert.equal(buildMonthlyExpenseAnalysis([], month, dayjs('2026-12-01')).days.length, 30);
  assert.equal(buildMonthlyExpenseAnalysis([], dayjs('2025-12-01'), dayjs('2026-01-05')).days.length, 31);
  assert.equal(buildMonthlyExpenseAnalysis([], dayjs('2024-02-01'), dayjs('2026-11-05')).days.length, 29);
});
