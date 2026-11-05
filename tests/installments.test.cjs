const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const Module = require('node:module');
const ts = require('typescript');
const dayjs = require('dayjs');

const loadTypeScript = (module, filename) => module._compile(ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, esModuleInterop: true, target: ts.ScriptTarget.ES2020, jsx: ts.JsxEmit.ReactJSX },
}).outputText, filename);
require.extensions['.ts'] = loadTypeScript;
require.extensions['.tsx'] = loadTypeScript;

const { buildInstallmentInvoices, buildInstallmentPurchaseUpdates, formatInstallmentDescription, getInstallmentBaseDescription, getInstallmentPurchaseId, isInstallmentInvoice, isValidInstallmentCount, MAX_INSTALLMENTS } = require('../src/utils/installments.ts');
const { buildRecurringCandidates } = require('../src/utils/recurringTransactions.ts');
const expense = (extra = {}) => ({
  id: '', userId: 'family', invoiceCategory: 'Eletrodomésticos', description: 'Cafeteira',
  value: 274.95, addDate: dayjs('2026-10-15'), addDateFormatted: '10/2026', ...extra,
});

test('creates the selected number of independent monthly expenses using the value of each installment', () => {
  const original = expense();
  const result = buildInstallmentInvoices(original, 3);
  assert.equal(result.length, 3);
  assert.deepEqual(result.map(entry => entry.addDate.format('YYYY-MM-DD')), ['2026-10-15', '2026-11-15', '2026-12-15']);
  assert.deepEqual(result.map(entry => entry.addDateFormatted), ['10/2026', '11/2026', '12/2026']);
  assert.deepEqual(result.map(entry => entry.value), [274.95, 274.95, 274.95]);
  assert.deepEqual(result.map(entry => entry.description), ['Cafeteira · Parcela 1/3', 'Cafeteira · Parcela 2/3', 'Cafeteira · Parcela 3/3']);
  assert.deepEqual(result.map(entry => entry.installmentNumber), [1, 2, 3]);
  assert.ok(result.every(entry => entry.installmentCount === 3 && isInstallmentInvoice(entry)));
  assert.ok(result.every(entry => entry.userId === 'family' && entry.invoiceCategory === 'Eletrodomésticos'));
  assert.equal(original.description, 'Cafeteira');
  assert.equal(original.addDate.format('YYYY-MM-DD'), '2026-10-15');
});

test('works without a description and does not inherit recurring linkage from a source expense', () => {
  const result = buildInstallmentInvoices(expense({ description: '', recurringTemplateId: 'old-template', id: 'old-id' }), 2);
  assert.deepEqual(result.map(entry => entry.description), ['Parcela 1/2', 'Parcela 2/2']);
  assert.ok(result.every(entry => !('recurringTemplateId' in entry) && entry.id === ''));
});

test('preserves an explicit monthly fixed marking on every installment and in storage', async () => {
  const { store, services } = firestoreDouble();
  for (const isMonthlyFixed of [true, false]) {
    const result = await services.putInstallmentInvoices(expense({ isMonthlyFixed }), 3, `fixed-${isMonthlyFixed}`);
    assert.ok(result.every(entry => entry.isMonthlyFixed === isMonthlyFixed));
    assert.ok(result.every(entry => store.get(`invoices/${entry.id}`).isMonthlyFixed === isMonthlyFixed));
  }
});

test('preserves the original day across short months, leap years and year boundaries', () => {
  const shortMonths = buildInstallmentInvoices(expense({ addDate: dayjs('2027-01-31') }), 3);
  assert.deepEqual(shortMonths.map(entry => entry.addDate.format('YYYY-MM-DD')), ['2027-01-31', '2027-02-28', '2027-03-31']);
  const leapYear = buildInstallmentInvoices(expense({ addDate: dayjs('2028-01-31') }), 3);
  assert.deepEqual(leapYear.map(entry => entry.addDate.format('YYYY-MM-DD')), ['2028-01-31', '2028-02-29', '2028-03-31']);
  const yearBoundary = buildInstallmentInvoices(expense({ addDate: dayjs('2026-12-20') }), 2);
  assert.deepEqual(yearBoundary.map(entry => entry.addDateFormatted), ['12/2026', '01/2027']);
});

test('validates quantity and monetary values before generating installments', () => {
  assert.equal(isValidInstallmentCount(2), true);
  assert.equal(isValidInstallmentCount(MAX_INSTALLMENTS), true);
  for (const count of [0, 1, -2, 2.5, NaN, Infinity, MAX_INSTALLMENTS + 1]) {
    assert.equal(isValidInstallmentCount(count), false);
    assert.throws(() => buildInstallmentInvoices(expense(), count));
  }
  for (const value of [0, -1, undefined, NaN, Infinity, 1.001]) {
    assert.throws(() => buildInstallmentInvoices(expense({ value }), 2));
  }
  assert.equal(buildInstallmentInvoices(expense({ value: 0.29 }), 2)[0].value, 0.29);
  assert.throws(() => buildInstallmentInvoices(expense({ addDate: null }), 2));
  assert.throws(() => buildInstallmentInvoices(expense({ addDate: dayjs('invalid') }), 2));
  assert.throws(() => buildInstallmentInvoices(expense({ invoiceCategory: ' ' }), 2));
});

test('generated installments are not suggested as indefinite monthly recurrence', () => {
  for (const description of ['', 'Cafeteira']) {
    const history = buildInstallmentInvoices(expense({ description }), 3);
    assert.equal(buildRecurringCandidates('expense', dayjs('2027-01-01'), history, [], []).length, 0);
    const renamed = history.map(entry => ({ ...entry, description: 'Descrição editada' }));
    assert.equal(buildRecurringCandidates('expense', dayjs('2027-01-01'), renamed, [], []).length, 0);
  }
});

test('recognizes new and legacy installments after edits, without classifying ordinary dated descriptions', () => {
  assert.equal(isInstallmentInvoice(expense({ installmentNumber: 2, installmentCount: 5, description: 'Consulta editada' })), true);
  assert.equal(isInstallmentInvoice(expense({ id: 'installment-purchase-2', description: 'Consulta editada' })), true);
  for (const description of ['Parcela 1/3', 'Consulta · Parcela 2/5', '1/2 cafeteira', '2 de 3 consulta']) {
    assert.equal(isInstallmentInvoice(expense({ description })), true, description);
  }
  for (const description of ['Compra em 05/11', '05/11/2026 consulta', '15/11/2026 consulta', 'Consulta comum', 'Parcela 0/3', 'Parcela 4/3', '1/1']) {
    assert.equal(isInstallmentInvoice(expense({ description })), false, description);
  }
  assert.equal(isInstallmentInvoice(expense({ installmentNumber: 4, installmentCount: 3 })), false);
});

function firestoreDouble() {
  const store = new Map();
  let pending = Promise.resolve();
  let generatedIds = 0;
  let failBeforeCommit = false;
  let loseAcknowledgement = false;
  const snapshot = ref => ({ id: ref.id, exists: () => store.has(ref.path), data: () => store.get(ref.path) });
  const api = {
    collection: (_db, name) => ({ path: name }),
    doc: (dbOrRef, name, id) => id === undefined
      ? { path: `${dbOrRef.path}/auto-${++generatedIds}`, id: `auto-${generatedIds}` }
      : { path: `${name}/${id}`, id },
    where: (field, operator, value) => ({ field, operator, value }),
    query: (ref, ...constraints) => ({ ...ref, constraints }),
    getDocs: async query => ({ docs: Array.from(store.entries()).filter(([key, data]) =>
      key.startsWith(`${query.path}/`) && query.constraints.every(({ field, value }) => data[field] === value),
    ).map(([key]) => snapshot({ path: key, id: key.split('/')[1] })) }),
    runTransaction: async (_db, callback) => {
      const previous = pending;
      let release;
      pending = new Promise(resolve => { release = resolve; });
      await previous;
      try {
        const writes = [];
        const result = await callback({
          get: async ref => { assert.equal(writes.length, 0, 'all reads must precede writes'); return snapshot(ref); },
          set: (ref, data) => writes.push([ref, data]),
        });
        if (failBeforeCommit) { failBeforeCommit = false; throw new Error('offline'); }
        for (const [ref, data] of writes) store.set(ref.path, data);
        if (loseAcknowledgement) { loseAcknowledgement = false; throw new Error('lost response'); }
        return result;
      } finally { release(); }
    },
  };
  const filename = path.resolve(__dirname, '../src/providers/invoices/installments.ts');
  const serviceModule = new Module(filename, module);
  serviceModule.filename = filename;
  serviceModule.paths = module.paths;
  serviceModule.require = name => name === 'firebase/firestore' ? api
    : name === '../offline/launches' ? { queueTransactions: async () => { throw new Error('Use the offline queue tests'); } }
    : name.endsWith('firebaseConfig') ? { database: {} } : Module.prototype.require.call(serviceModule, name);
  loadTypeScript(serviceModule, filename);
  return {
    store, services: serviceModule.exports,
    failBeforeCommit: () => { failBeforeCommit = true; },
    loseAcknowledgement: () => { loseAcknowledgement = true; },
  };
}

test('persists all installments together in the existing invoices collection', async () => {
  const { store, services } = firestoreDouble();
  const id = services.createInstallmentPurchaseId();
  const result = await services.putInstallmentInvoices(expense(), 3, id);
  assert.equal(store.size, 3);
  assert.equal(new Set(result.map(entry => entry.id)).size, 3);
  for (const entry of result) {
    assert.equal(store.get(`invoices/${entry.id}`).addDate, entry.addDate.toString());
    assert.equal(store.get(`invoices/${entry.id}`).value, 274.95);
    assert.equal(store.get(`invoices/${entry.id}`).installmentNumber, entry.installmentNumber);
    assert.equal(store.get(`invoices/${entry.id}`).installmentCount, 3);
    assert.equal(store.get(`invoices/${entry.id}`).installmentPurchaseId, id);
    assert.equal(entry.userId, 'family');
  }
});

test('failed saves create no partial purchase; retrying a lost response creates no duplicate installments', async () => {
  const { store, services, failBeforeCommit, loseAcknowledgement } = firestoreDouble();
  failBeforeCommit();
  await assert.rejects(() => services.putInstallmentInvoices(expense(), 3, 'purchase'));
  assert.equal(store.size, 0);
  loseAcknowledgement();
  await assert.rejects(() => services.putInstallmentInvoices(expense(), 3, 'purchase'));
  assert.equal(store.size, 3);
  const result = await services.putInstallmentInvoices(expense(), 3, 'purchase');
  assert.equal(store.size, 3);
  assert.equal(result.length, 3);
});

test('concurrent submissions share one set while separate purchases remain independent', async () => {
  const { store, services } = firestoreDouble();
  const results = await Promise.all([
    services.putInstallmentInvoices(expense(), 3, 'purchase'),
    services.putInstallmentInvoices(expense(), 3, 'purchase'),
  ]);
  assert.equal(store.size, 3);
  assert.deepEqual(results[0].map(entry => entry.id), results[1].map(entry => entry.id));
  await services.putInstallmentInvoices(expense(), 3, 'another-purchase');
  assert.equal(store.size, 6);
});

test('a retry preserves independent edits and does not restore a deleted installment', async () => {
  const { store, services } = firestoreDouble();
  const result = await services.putInstallmentInvoices(expense(), 3, 'purchase');
  const editedKey = `invoices/${result[1].id}`;
  store.set(editedKey, { ...store.get(editedKey), value: 250, description: 'Descrição ajustada' });
  store.delete(`invoices/${result[2].id}`);
  const repeated = await services.putInstallmentInvoices(expense(), 3, 'purchase');
  assert.equal(store.size, 2);
  assert.equal(repeated.length, 2);
  assert.equal(repeated[1].value, 250);
  assert.equal(repeated[1].description, 'Descrição ajustada');
  assert.equal(isInstallmentInvoice(repeated[1]), true);
  assert.equal(store.has(`invoices/${result[2].id}`), false);
});

test('rejects invalid input before writing and cannot reuse another user’s purchase', async () => {
  const { store, services } = firestoreDouble();
  await assert.rejects(() => services.putInstallmentInvoices(expense(), 0, 'purchase'));
  await assert.rejects(() => services.putInstallmentInvoices(expense({ userId: '' }), 3, 'purchase'));
  await assert.rejects(() => services.putInstallmentInvoices(expense(), 3, '../invalid'));
  assert.equal(store.size, 0);
  await services.putInstallmentInvoices(expense(), 3, 'purchase');
  await assert.rejects(() => services.putInstallmentInvoices(expense({ userId: 'another-user' }), 3, 'purchase'));
  assert.ok(Array.from(store.values()).every(entry => entry.userId === 'family'));
});

test('the compact option only reveals quantity and total when installment purchase is checked', () => {
  const React = require('react');
  const { renderToStaticMarkup } = require('react-dom/server');
  const { InstallmentOptions } = require('../src/components/ModalAddInvoice/InstallmentOptions.tsx');
  const props = { checked: false, count: '3', value: 100, disabled: false, onCheckedChange() {}, onCountChange() {} };
  const compact = renderToStaticMarkup(React.createElement(InstallmentOptions, props));
  assert.match(compact, /Compra parcelada/);
  assert.doesNotMatch(compact, /Quantidade de parcelas/);
  const expanded = renderToStaticMarkup(React.createElement(InstallmentOptions, { ...props, checked: true }));
  assert.match(expanded, /Quantidade de parcelas/);
  assert.match(expanded, /Total R\$/);
  assert.match(expanded, /300,00/);
  const invalid = renderToStaticMarkup(React.createElement(InstallmentOptions, { ...props, checked: true, count: '1' }));
  assert.match(invalid, /Informe de 2 a 500 parcelas/);
});

test('editing a purchase updates category, amount and description across all months without mixing identical purchases', async () => {
  const { store, services } = firestoreDouble();
  const group = await services.putInstallmentInvoices(expense(), 3, 'purchase');
  const other = await services.putInstallmentInvoices(expense(), 3, 'purchase-other');
  const original = group[1];
  const updated = await services.updateInstallmentPurchase('family', original, {
    ...original, value: 300, invoiceCategory: 'Casa', description: 'Cafeteira nova',
  });
  assert.equal(updated.length, 3);
  assert.deepEqual(updated.map(entry => entry.description), ['Cafeteira nova · Parcela 1/3', 'Cafeteira nova · Parcela 2/3', 'Cafeteira nova · Parcela 3/3']);
  assert.deepEqual(updated.map(entry => entry.addDate.format('YYYY-MM-DD')), ['2026-10-15', '2026-11-15', '2026-12-15']);
  assert.ok(updated.every(entry => entry.value === 300 && entry.invoiceCategory === 'Casa'));
  assert.ok(updated.every(entry => store.get(`invoices/${entry.id}`).value === 300));
  assert.ok(other.every(entry => store.get(`invoices/${entry.id}`).value === 274.95));
  assert.equal(store.size, 6);
});

test('changing only the description preserves independent amounts and launch dates of other installments', async () => {
  const { store, services } = firestoreDouble();
  const group = await services.putInstallmentInvoices(expense(), 3, 'purchase');
  const firstKey = `invoices/${group[0].id}`;
  store.set(firstKey, { ...store.get(firstKey), value: 250, addDate: dayjs('2026-10-20').toString() });
  const updated = await services.updateInstallmentPurchase('family', group[1], { ...group[1], description: 'Nome novo' });
  assert.equal(updated[0].value, 250);
  assert.equal(updated[0].addDate.format('YYYY-MM-DD'), '2026-10-20');
  assert.equal(updated[1].value, 274.95);
});

test('rescheduling from a middle installment preserves monthly positions and is idempotent after a lost response', async () => {
  const { store, services, loseAcknowledgement } = firestoreDouble();
  const group = await services.putInstallmentInvoices(expense({ addDate: dayjs('2027-01-31') }), 3, 'purchase');
  const original = group[1];
  const edited = { ...original, addDate: dayjs('2027-03-31'), addDateFormatted: '03/2027', value: 300 };
  loseAcknowledgement();
  await assert.rejects(() => services.updateInstallmentPurchase('family', original, edited));
  const updated = await services.updateInstallmentPurchase('family', original, edited);
  assert.deepEqual(updated.map(entry => entry.addDate.format('YYYY-MM-DD')), ['2027-02-28', '2027-03-31', '2027-04-30']);
  assert.deepEqual(updated.map(entry => entry.addDateFormatted), ['02/2027', '03/2027', '04/2027']);
  assert.ok(updated.every(entry => entry.value === 300));
  assert.equal(store.size, 3);
});

test('batch editing never recreates a deleted installment and a failed transaction leaves all entries unchanged', async () => {
  const { store, services, failBeforeCommit } = firestoreDouble();
  const group = await services.putInstallmentInvoices(expense(), 3, 'purchase');
  store.delete(`invoices/${group[2].id}`);
  const originalStore = JSON.stringify(Array.from(store));
  failBeforeCommit();
  await assert.rejects(() => services.updateInstallmentPurchase('family', group[0], { ...group[0], value: 350 }));
  assert.equal(JSON.stringify(Array.from(store)), originalStore);
  const updated = await services.updateInstallmentPurchase('family', group[0], { ...group[0], value: 350 });
  assert.equal(updated.length, 2);
  assert.deepEqual(updated.map(entry => entry.installmentNumber), [1, 2]);
  assert.ok(updated.every(entry => entry.installmentCount === 3));
  assert.equal(store.has(`invoices/${group[2].id}`), false);
});

test('older generated purchases are linked by their IDs while unlinked manual installments remain isolated', async () => {
  const { store, services } = firestoreDouble();
  const group = await services.putInstallmentInvoices(expense(), 3, 'old-purchase');
  const old = group.map(entry => {
    const { installmentPurchaseId, installmentNumber, installmentCount, ...legacy } = entry;
    store.set(`invoices/${entry.id}`, { ...legacy, addDate: entry.addDate.toString() });
    return legacy;
  });
  assert.equal(getInstallmentPurchaseId(old[1]), 'old-purchase');
  const updated = await services.updateInstallmentPurchase('family', old[1], { ...old[1], value: 400 });
  assert.equal(updated.length, 3);
  assert.ok(updated.every(entry => entry.installmentPurchaseId === 'old-purchase' && entry.value === 400));
  assert.equal((await services.getInstallmentPurchaseInvoices('family', updated[1])).length, 3);
  const manual = expense({ id: 'manual', description: 'Cafeteira · Parcela 1/3' });
  assert.equal(getInstallmentPurchaseId(manual), null);
  await assert.rejects(() => services.updateInstallmentPurchase('family', manual, { ...manual, value: 100 }));
});

test('batch edits reject another account, malformed values, mixed purchases and inconsistent numbering before writing', async () => {
  const { store, services } = firestoreDouble();
  const group = await services.putInstallmentInvoices(expense(), 3, 'purchase');
  const originalStore = JSON.stringify(Array.from(store));
  await assert.rejects(() => services.updateInstallmentPurchase('other-family', group[0], { ...group[0], value: 200 }));
  for (const value of [undefined, 0, -1, NaN, Infinity, 1.001]) {
    await assert.rejects(() => services.updateInstallmentPurchase('family', group[0], { ...group[0], value }));
  }
  const foreign = { ...group[1], userId: 'other-family' };
  assert.throws(() => buildInstallmentPurchaseUpdates(group[0], group[0], [group[0], foreign]));
  assert.throws(() => buildInstallmentPurchaseUpdates(group[0], group[0], [group[0], { ...group[1], installmentCount: 4 }]));
  assert.equal(JSON.stringify(Array.from(store)), originalStore);
});

test('single installment descriptions retain their number while the editor uses only the purchase description', () => {
  assert.equal(getInstallmentBaseDescription('Cafeteira · Parcela 2/3'), 'Cafeteira');
  assert.equal(getInstallmentBaseDescription('Parcela 2/3'), '');
  assert.equal(formatInstallmentDescription('Nome editado', 2, 3), 'Nome editado · Parcela 2/3');
  assert.equal(formatInstallmentDescription('', 2, 3), 'Parcela 2/3');
  assert.equal(formatInstallmentDescription('Descrição avulsa', 2, null), 'Descrição avulsa');
});

test('editing options distinguish one installment from the full purchase and expose loading errors', () => {
  const React = require('react');
  const { renderToStaticMarkup } = require('react-dom/server');
  const { InstallmentEditOptions } = require('../src/components/ModalAddInvoice/InstallmentEditOptions.tsx');
  const props = { scope: 'all', onChange() {}, loading: false, disabled: false, error: '', onRetry() {} };
  const html = renderToStaticMarkup(React.createElement(InstallmentEditOptions, props));
  assert.match(html, /Só esta parcela/);
  assert.match(html, /Todas as parcelas/);
  assert.equal((html.match(/type="radio"/g) || []).length, 2);
  const loading = renderToStaticMarkup(React.createElement(InstallmentEditOptions, { ...props, loading: true }));
  assert.match(loading, /Carregando parcelas da compra/);
  const error = renderToStaticMarkup(React.createElement(InstallmentEditOptions, { ...props, error: 'Erro ao carregar' }));
  assert.match(error, /Erro ao carregar/);
  assert.match(error, /Tentar novamente/);
});
