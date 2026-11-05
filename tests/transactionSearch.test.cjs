const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
const dayjs = require('dayjs');

require.extensions['.ts'] = (module, filename) => module._compile(ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, esModuleInterop: true, target: ts.ScriptTarget.ES2020 },
}).outputText, filename);

const { filterTransactions } = require('../src/utils/transactionSearch.ts');
const expense = {
  id: 'expense-abc', userId: 'family-xyz', recurringTemplateId: 'template-123',
  invoiceCategory: 'Alimentação', description: 'Compra no Mercado São José',
  value: 1234.5, addDate: dayjs('2026-11-05'), addDateFormatted: '11/2026',
};
const revenue = {
  id: 'revenue-def', userId: 'family-xyz', revenueCategory: 'Salário', description: 'Pagamento mensal',
  value: 9876.54, addDate: dayjs('2026-11-10'), addDateFormatted: '11/2026',
};
const transactions = [expense, revenue];

test('searches expense and revenue categories and descriptions regardless of case, accents or spacing', () => {
  assert.deepEqual(filterTransactions(transactions, '  ALIMENTACAO  '), [expense]);
  assert.deepEqual(filterTransactions(transactions, 'sao   jose'), [expense]);
  assert.deepEqual(filterTransactions(transactions, 'salario'), [revenue]);
  assert.deepEqual(filterTransactions(transactions, 'pagamento'), [revenue]);
  assert.deepEqual(filterTransactions(transactions, 'inexistente'), []);
});

test('finds amounts with decimals, Brazilian grouping, currency symbols and partial values', () => {
  for (const query of ['1234.5', '1234.50', '1234,50', '1.234,50', 'R$ 1.234,50', 'R$\u00a01.234,50', 'R$1.234,50', 'R$1234,50', 'R$1234.50', '234,5']) {
    assert.deepEqual(filterTransactions(transactions, query), [expense], query);
  }
  assert.deepEqual(filterTransactions(transactions, '9876,54'), [revenue]);
  assert.deepEqual(filterTransactions(transactions, '1234,99'), []);
});

test('finds full and partial dates in common formats and Portuguese month names', () => {
  for (const query of ['05/11/2026', '5/11/2026', '2026-11-05', '05-11-2026', '05.11.2026', '05/11', '5 de novembro de 2026']) {
    assert.deepEqual(filterTransactions(transactions, query), [expense], query);
  }
  for (const query of ['11/2026', 'novembro', '2026']) {
    assert.deepEqual(filterTransactions(transactions, query), transactions, query);
  }
  assert.deepEqual(filterTransactions(transactions, '10/11/2026'), [revenue]);
});

test('combines terms across fields and requires all terms to belong to the same transaction', () => {
  assert.deepEqual(filterTransactions(transactions, 'alimentacao 1234,50 05/11'), [expense]);
  assert.deepEqual(filterTransactions(transactions, '9876.54 salario novembro'), [revenue]);
  assert.deepEqual(filterTransactions(transactions, 'mercado salario'), []);
});

test('includes identifiers and additional stored fields', () => {
  for (const query of ['expense-abc', 'template-123']) {
    assert.deepEqual(filterTransactions(transactions, query), [expense]);
  }
  assert.deepEqual(filterTransactions(transactions, 'family-xyz'), transactions);
  const extended = { ...expense, note: 'Transferência via Pix' };
  assert.deepEqual(filterTransactions([extended], 'transferencia pix'), [extended]);
});

test('handles empty searches, missing fields, invalid dates and zero amounts', () => {
  assert.equal(filterTransactions(transactions, ' \t\n '), transactions);
  const incomplete = { ...expense, addDate: null, description: undefined, invoiceCategory: undefined, value: undefined };
  assert.deepEqual(filterTransactions([incomplete], 'undefined'), []);
  assert.deepEqual(filterTransactions([incomplete], 'null'), []);
  assert.deepEqual(filterTransactions([{ ...incomplete, addDate: dayjs('invalid'), value: NaN }], 'invalid'), []);
  const zero = { ...incomplete, value: 0 };
  assert.deepEqual(filterTransactions([zero], '0,00'), [zero]);
});

test('monthly fixed expenses are searchable by their marking and month, without a specific day', () => {
  const fixed = { ...expense, isMonthlyFixed: true };
  for (const query of ['fixa', 'fixo', 'fixa novembro']) {
    assert.deepEqual(filterTransactions([fixed, revenue], query), [fixed], query);
  }
  for (const query of ['11/2026', '2026-11']) assert.deepEqual(filterTransactions([fixed], query), [fixed], query);
  assert.deepEqual(filterTransactions([fixed, revenue], 'mensal'), [fixed, revenue]);
  assert.deepEqual(filterTransactions([fixed], '05/11/2026'), []);
  assert.deepEqual(filterTransactions([fixed], '05/11'), []);
});

test('installment search follows the automatic grouping while retaining the saved launch date', () => {
  const installment = { ...expense, installmentNumber: 2, installmentCount: 3, isMonthlyFixed: true };
  for (const query of ['parcelada', 'parcelado', 'parcelas', '05/11/2026', 'parcelada novembro']) {
    assert.deepEqual(filterTransactions([installment, revenue], query), [installment], query);
  }
  assert.deepEqual(filterTransactions([installment], 'fixa'), []);
});
