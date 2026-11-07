const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const Module = require('node:module');
const ts = require('typescript');
const React = require('react');
const { renderToStaticMarkup } = require('react-dom/server');

require.extensions['.ts'] = require.extensions['.tsx'] = (module, filename) => module._compile(ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, esModuleInterop: true, jsx: ts.JsxEmit.ReactJSX },
}).outputText, filename);
const { getMonthlyBalance } = require('../src/utils/monthlyBalance.ts');
const investment = value => ({ value, invoiceCategory: 'Investimentos' });

test('reserves the investment plan once and hides the duplicate plan card (screenshot values)', () => {
  assert.deepEqual(getMonthlyBalance(11500, 6224.37, [investment(2000)]), {
    availableToSpend: 3275.63, plannedInvestments: 2000, preservedInvestments: 2000, showInvestmentPlan: false,
  });
});

test('shows the original plan only after expenses consume the investment reserve', () => {
  assert.deepEqual(getMonthlyBalance(10000, 8500, [investment(2000)]), {
    availableToSpend: -500, plannedInvestments: 2000, preservedInvestments: 1500, showInvestmentPlan: true,
  });
  assert.deepEqual(getMonthlyBalance(10000, 8000, [investment(2000)]), {
    availableToSpend: 0, plannedInvestments: 2000, preservedInvestments: 2000, showInvestmentPlan: false,
  });
});

test('keeps the consumed plan visible when the reserve reaches zero or expenses exceed revenue', () => {
  for (const [revenue, expenses, available] of [[10000, 10000, -2000], [10000, 11000, -3000], [0, 500, -2500]]) {
    assert.deepEqual(getMonthlyBalance(revenue, expenses, [investment(2000)]), {
      availableToSpend: available, plannedInvestments: 2000, preservedInvestments: 0, showInvestmentPlan: true,
    });
  }
});

test('without an investment plan the available amount remains revenue minus expenses', () => {
  for (const [revenue, expenses] of [[10000, 2500], [0, 500], [0, 0]]) {
    assert.deepEqual(getMonthlyBalance(revenue, expenses, [{ value: 2500, invoiceCategory: 'Contas' }]), {
      availableToSpend: revenue - expenses, plannedInvestments: 0, preservedInvestments: 0, showInvestmentPlan: false,
    });
  }
});

test('compares currency in cents so floating point residues do not consume the reserve', () => {
  const result = getMonthlyBalance(0.6, 0.1 + 0.2, [investment(0.1), investment(0.2)]);
  assert.equal(result.availableToSpend, 0);
  assert.equal(result.preservedInvestments, 0.3);
  assert.equal(result.showInvestmentPlan, false);
  const consumed = getMonthlyBalance(0.6, 0.31, [investment(0.1), investment(0.2)]);
  assert.equal(consumed.availableToSpend, -0.01);
  assert.equal(consumed.preservedInvestments, 0.29);
  assert.equal(consumed.showInvestmentPlan, true);
});

test('recognizes normalized investment categories and ignores missing or invalid amounts', () => {
  const result = getMonthlyBalance(1000, 100, [
    { value: 200, invoiceCategory: '  INVESTIMÉNTOS  ' }, investment(100),
    investment(undefined), investment(NaN), { value: 50 },
  ]);
  assert.equal(result.plannedInvestments, 300);
  assert.equal(result.availableToSpend, 600);
});

function renderHome(expenses, showValues = true) {
  const filename = path.resolve(__dirname, '../src/pages/index.tsx');
  const instance = new Module(filename, module);
  instance.filename = filename;
  instance.paths = module.paths;
  const empty = () => null;
  const mocks = {
    react: { ...React, useState: initial => [initial === false ? showValues : initial, () => {}] },
    'next/head': empty,
    '../hooks/useAuth': { useProtectPage() {} },
    '../contexts/offlineSync': { useOfflineSync: () => ({ online: true }) },
    '../contexts/expenses': { ExpensesContext: React.createContext({ monthlyExpenses: expenses, invoices: [investment(2000)], loadingGetInvoices: false }) },
    '../contexts/revenues': { RevenuesContext: React.createContext({ monthlyRevenues: 11500, loadingGetRevenues: false }) },
    '../contexts/monthSelected': { MonthSelectedContext: React.createContext({ dateToAnalyze: { toDate: () => new Date(2026, 10, 1) } }) },
    '../components/AppLayoutMobile': { LayoutMobile: ({ children }) => children },
    '../components/ExpensesPieChart': { PieChart: empty },
    '../components/MonthlyExpensesTimeline': { MonthlyExpensesTimeline: empty },
    '../components/MonthlyExpenseCharts': { MonthlyExpenseCharts: empty },
    '../components/SkeletonLoadingHomePage': { LoadingHomePage: empty },
    '../components/ModalAddInvoice': { AddInvoiceModal: empty },
  };
  instance.require = name => Object.hasOwn(mocks, name) ? mocks[name] : Module.prototype.require.call(instance, name);
  require.extensions['.tsx'](instance, filename);
  return renderToStaticMarkup(React.createElement(instance.exports.default));
}

test('home displays the spendable balance and adapts its message and plan card as the reserve is consumed', () => {
  const reserved = renderHome(6224.37);
  assert.match(reserved, /3\.275,63/);
  assert.match(reserved, /28% da receita disponível para gastar/);
  assert.match(reserved, /Investimento planejado reservado/);
  assert.doesNotMatch(reserved, />Investimento planejado</);

  const consumed = renderHome(10000);
  assert.match(consumed, /-R\$[^<]*500,00/);
  assert.match(consumed, /Consumindo o investimento planejado/);
  assert.match(consumed, />Investimento planejado</);
  assert.match(consumed, /1\.500,00/);

  const exhausted = renderHome(11500);
  assert.match(exhausted, /Investimento planejado consumido/);
  assert.match(exhausted, />Investimento planejado</);
  assert.match(exhausted, /Preservado para investir/);
});

test('home keeps the new balance and investment messages hidden when values are masked', () => {
  const hidden = renderHome(6224.37, false);
  assert.doesNotMatch(hidden, /3\.275,63|28%|Investimento planejado reservado/);
  assert.match(hidden, /\*\*\*\*/);
});
