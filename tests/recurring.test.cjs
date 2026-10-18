const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const Module = require('node:module');
const ts = require('typescript');
const dayjs = require('dayjs');

// Exercise the project's TypeScript without adding a second test/transpile stack.
require.extensions['.ts'] = (module, filename) => {
  const source = ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, esModuleInterop: true, target: ts.ScriptTarget.ES2020 },
  }).outputText;
  module._compile(source, filename);
};

const {
  buildRecurringCandidates, dateForRecurringDay, historyMonthKeys, isValidRecurringSelection,
  recurringIdentity, updatedRecurringTemplates,
} = require('../src/utils/recurringTransactions.ts');

const month = dayjs('2026-10-01');
const expense = (date, category, description, value, extra = {}) => ({
  id: `${date}-${category}-${description}`, userId: 'family', invoiceCategory: category,
  description, value, addDate: dayjs(date), addDateFormatted: dayjs(date).format('MM/YYYY'), ...extra,
});
const revenue = (date, description, value) => {
  const { invoiceCategory, ...entry } = expense(date, 'Salário', description, value);
  return { ...entry, revenueCategory: invoiceCategory };
};
const template = (category = 'Contas', description = 'Luz', value = 385, kind = 'expense') => ({
  id: recurringIdentity(kind, category, description), kind, category, description, value,
  day: 15, startsOn: '2026-09', lastUsedMonth: '2026-09', active: true,
});
const selection = (item = template(), value = item.value, date = '2026-10-15') => ({ template: item, value, date });

test('uses exactly the six months before the selected month, across years', () => {
  assert.deepEqual(historyMonthKeys(dayjs('2027-02-01')), ['01/2027', '12/2026', '11/2026', '10/2026', '09/2026', '08/2026']);
  const candidates = buildRecurringCandidates('expense', month, [
    expense('2026-03-15', 'Contas', 'Luz', 200),
    expense('2026-04-15', 'Contas', 'Luz', 250),
    expense('2026-09-15', 'Contas', 'Luz', 385),
    expense('2026-10-15', 'Contas', 'Luz', 500),
    expense('2026-11-15', 'Contas', 'Luz', 700),
  ], [], []);
  assert.equal(candidates.length, 1);
  assert.equal(candidates[0].occurrences, 2);
  assert.equal(candidates[0].template.value, 385);
  assert.equal(candidates[0].suggested, true);
});

test('recognizes normalized descriptions despite large changes in utility bills and salaries', () => {
  const bills = buildRecurringCandidates('expense', month, [
    expense('2026-08-15', ' Contas ', ' ÁGUA ', 90), expense('2026-09-15', 'contas', 'agua', 240),
  ], [], []);
  assert.equal(bills.length, 1);
  assert.equal(bills[0].suggested, true);
  const salaries = buildRecurringCandidates('revenue', month, [
    revenue('2026-08-15', 'Filipe', 7800), revenue('2026-09-15', 'Filipe', 9300),
    revenue('2026-08-15', 'Lu', 3700), revenue('2026-09-15', 'Lu', 3900),
  ], [], []);
  assert.equal(salaries.length, 2);
  assert.ok(salaries.every(item => item.suggested));
  assert.deepEqual(salaries.map(item => item.template.description), ['Filipe', 'Lu']);
});

test('sorts all candidates by descending value, including saved items and manual history', () => {
  const result = buildRecurringCandidates('expense', month, [
    expense('2026-09-15', 'Financiamento', '', 1600), expense('2026-08-15', 'Financiamento', '', 1600),
    expense('2026-09-15', 'Educação', 'Filipe', 184), expense('2026-09-15', 'Educação', 'Luiza', 166.66),
  ], [template()], []);
  assert.deepEqual(result.map(item => item.template.value), [1600, 385, 184, 166.66]);
});

test('does not infer monthly recurrence from frequent purchases or ambiguous blank descriptions', () => {
  const result = buildRecurringCandidates('expense', month, [
    expense('2026-09-15', 'Restaurante', 'Almoço', 1500), expense('2026-08-15', 'Restaurante', 'Almoço', 1500),
    expense('2026-09-03', 'Restaurante', 'Treichel', 90), expense('2026-09-09', 'Restaurante', 'Treichel', 95),
    expense('2026-08-10', 'Restaurante', 'Treichel', 90),
    expense('2026-08-15', 'Supermercado', '', 100), expense('2026-09-15', 'Supermercado', '', 400),
    expense('2026-08-15', 'Financiamento', '', 1600), expense('2026-09-15', 'Financiamento', '', 1700),
  ], [], []);
  assert.equal(result.find(item => item.template.description === 'Almoço').suggested, true);
  assert.equal(result.find(item => item.template.description === 'Treichel').suggested, false);
  assert.equal(result.find(item => item.template.category === 'Supermercado').suggested, false);
  assert.equal(result.find(item => item.template.category === 'Financiamento').suggested, true);
});

test('excludes installments and unusable entries, retaining single occurrences for manual choice', () => {
  const result = buildRecurringCandidates('expense', month, [
    expense('2026-08-15', 'Eletrodomésticos', '1/2 cafeteira', 274.95),
    expense('2026-09-15', 'Eletrodomésticos', '2 de 2 cafeteira', 274.95),
    expense('2026-09-15', 'Contas', 'Internet', 110),
    expense('2026-09-15', 'Contas', 'Inválido', undefined),
    expense('2026-09-15', '', 'Sem categoria', 10),
    expense('invalid', 'Contas', 'Data inválida', 10),
  ], [], []);
  assert.equal(result.length, 1);
  assert.equal(result[0].template.description, 'Internet');
  assert.equal(result[0].suggested, false);
});

test('suggests repeated restaurant expenses over 300 despite smaller purchases with the same description', () => {
  for (const description of ['Almoço', '']) {
    const candidates = buildRecurringCandidates('expense', month, [
      expense('2026-08-15', 'Restaurante', description, 1500),
      expense('2026-08-20', 'Restaurante', description, 90),
      expense('2026-09-15', 'Restaurante', description, 1550),
      expense('2026-09-20', 'Restaurante', description, 110),
      expense('2026-09-25', 'Restaurante', description, 500),
    ], [], [expense('2026-10-02', 'Restaurante', description, 100)]);
    const result = candidates.filter(item => item.suggested);
    assert.equal(result.length, 1);
    assert.equal(result[0].suggested, true);
    assert.equal(result[0].occurrences, 2);
    assert.equal(result[0].template.value, 1550);
    assert.equal(result[0].template.day, 15);
    assert.equal(result[0].alreadyPosted, false);
    assert.equal(result[0].template.matchValue, true);
  }
});

test('small restaurant purchases do not block a large monthly expense even with one historical entry per month', () => {
  const history = [
    expense('2026-08-15', 'Restaurante', 'Almoço', 1500),
    expense('2026-09-15', 'Restaurante', 'Almoço', 1500),
  ];
  const smallPurchase = buildRecurringCandidates('expense', month, history, [], [
    expense('2026-10-02', 'Restaurante', 'Almoço', 90),
  ])[0];
  assert.equal(smallPurchase.suggested, true);
  assert.equal(smallPurchase.alreadyPosted, false);
  const monthlyPurchase = buildRecurringCandidates('expense', month, history, [], [
    expense('2026-10-20', 'Restaurante', 'Almoço', 1450),
  ])[0];
  assert.equal(monthlyPurchase.alreadyPosted, true);
});

test('the high-value exception requires similar amounts over 300 in distinct months', () => {
  for (const history of [
    [expense('2026-08-15', 'Restaurante', '', 300), expense('2026-08-20', 'Restaurante', '', 90), expense('2026-09-15', 'Restaurante', '', 300)],
    [expense('2026-09-15', 'Restaurante', '', 1500), expense('2026-09-20', 'Restaurante', '', 1500)],
    [expense('2026-08-15', 'Restaurante', '', 500), expense('2026-08-20', 'Restaurante', '', 90), expense('2026-09-15', 'Restaurante', '', 1500)],
  ]) {
    assert.equal(buildRecurringCandidates('expense', month, history, [], [])[0].suggested, false);
  }
});

test('keeps the saved monthly restaurant value instead of replacing it with a later small purchase', () => {
  for (const saved of [template('Restaurante', 'Almoço', 1500), { ...template('Restaurante', 'Almoço', 1500), matchValue: true }]) {
    const result = buildRecurringCandidates('expense', month, [
      expense('2026-09-15', 'Restaurante', 'Almoço', 1550),
      expense('2026-09-25', 'Restaurante', 'Almoço', 80),
    ], [saved], [expense('2026-10-02', 'Restaurante', 'Almoço', 100)])[0];
    assert.equal(result.saved, true);
    assert.equal(result.template.value, 1550);
    assert.equal(result.template.day, 15);
    assert.equal(result.alreadyPosted, false);
    const manuallyEdited = expense('2026-10-10', 'Restaurante', 'Almoço', 200, { recurringTemplateId: saved.id });
    assert.equal(buildRecurringCandidates('expense', month, [], [saved], [manuallyEdited])[0].alreadyPosted, true);
  }
});

test('repeated high values also work in other expense categories with multiple monthly purchases', () => {
  const result = buildRecurringCandidates('expense', month, [
    expense('2026-08-15', 'Supermercado', '', 500), expense('2026-08-20', 'Supermercado', '', 50),
    expense('2026-09-15', 'Supermercado', '', 550), expense('2026-09-20', 'Supermercado', '', 60),
  ], [], [])[0];
  assert.equal(result.suggested, true);
  assert.equal(result.template.value, 550);
});

test('recognizes digital subscriptions with empty, missing and whitespace-only descriptions', () => {
  const result = buildRecurringCandidates('expense', month, [
    expense('2026-07-15', 'Assinaturas Digitais', '', 200, { description: undefined }),
    expense('2026-08-15', 'Assinaturas Digitais', '', 195, { description: null }),
    expense('2026-09-15', 'Assinaturas Digitais', '   ', 210),
  ], [], []);
  assert.equal(result.length, 1);
  assert.equal(result[0].suggested, true);
  assert.equal(result[0].occurrences, 3);
  assert.equal(result[0].template.description, '');
  assert.equal(result[0].template.value, 210);
});

test('does not hide an unnamed subscription under 300 when other blank purchases occur in its category', () => {
  const result = buildRecurringCandidates('expense', month, [
    expense('2026-08-15', 'Assinaturas Digitais', '', 200),
    expense('2026-08-20', 'Assinaturas Digitais', '', 20),
    expense('2026-09-15', 'Assinaturas Digitais', '', 210),
    expense('2026-09-25', 'Assinaturas Digitais', '', 90),
  ], [], [expense('2026-10-02', 'Assinaturas Digitais', '', 20)]);
  const recurring = result.filter(item => item.suggested);
  assert.equal(recurring.length, 1);
  assert.equal(recurring[0].template.value, 210);
  assert.equal(recurring[0].template.day, 15);
  assert.equal(recurring[0].alreadyPosted, false);
});

test('separates multiple unnamed monthly subscriptions by amount without treating same-month purchases as recurrence', () => {
  const history = [
    expense('2026-08-15', 'Assinaturas Digitais', '', 200),
    expense('2026-08-20', 'Assinaturas Digitais', '', 50),
    expense('2026-09-15', 'Assinaturas Digitais', '', 210),
    expense('2026-09-20', 'Assinaturas Digitais', '', 50),
    expense('2026-09-25', 'Assinaturas Digitais', '', 15),
    expense('2026-09-26', 'Assinaturas Digitais', '', 15),
  ];
  const result = buildRecurringCandidates('expense', month, history, [], [
    expense('2026-10-05', 'Assinaturas Digitais', '', 50),
  ]);
  const recurring = result.filter(item => item.suggested);
  assert.deepEqual(recurring.map(item => item.template.value), [210, 50]);
  assert.notEqual(recurring[0].template.id, recurring[1].template.id);
  assert.equal(recurring[0].alreadyPosted, false);
  assert.equal(recurring[1].alreadyPosted, true);
  assert.equal(result.find(item => item.template.value === 15).suggested, false);
});

test('keeps saved unnamed subscriptions tied to their amount and suppresses stopped ones', () => {
  const saved = template('Assinaturas Digitais', '', 200);
  const history = [
    expense('2026-09-15', 'Assinaturas Digitais', '', 210),
    expense('2026-09-25', 'Assinaturas Digitais', '', 20),
  ];
  const result = buildRecurringCandidates('expense', month, history, [saved], [
    expense('2026-10-02', 'Assinaturas Digitais', '', 20),
  ]);
  const recurring = result.find(item => item.saved);
  assert.equal(recurring.template.id, saved.id);
  assert.equal(recurring.template.value, 210);
  assert.equal(recurring.template.day, 15);
  assert.equal(recurring.alreadyPosted, false);
  const stopped = buildRecurringCandidates('expense', month, history, [{ ...saved, active: false }], []);
  assert.equal(stopped.some(item => item.saved || item.suggested), false);
});

test('retains saved items beyond history and stops suggesting items explicitly removed', () => {
  const saved = template();
  const disabled = { ...template('Contas', 'Internet', 110), active: false };
  const result = buildRecurringCandidates('expense', month, [], [saved, disabled], []);
  assert.equal(result.find(item => item.template.id === saved.id).saved, true);
  const stopped = result.find(item => item.template.id === disabled.id);
  assert.equal(stopped.saved, false);
  assert.equal(stopped.suggested, false);
  assert.equal(stopped.template.active, true); // Available only through an explicit history choice.
  assert.equal(buildRecurringCandidates('expense', dayjs('2026-08-01'), [], [saved], []).length, 0);
});

test('recognizes manually entered items, while separating utilities and people', () => {
  const luz = template();
  const internet = template('Contas', 'Internet', 110);
  const result = buildRecurringCandidates('expense', month, [], [luz, internet], [
    expense('2026-10-20', 'Contas', ' LUZ ', 600),
  ]);
  assert.equal(result.find(item => item.template.id === luz.id).alreadyPosted, true);
  assert.equal(result.find(item => item.template.id === internet.id).alreadyPosted, false);
  const updated = expense('2026-10-19', 'Outra categoria', 'Nome alterado', 700, { recurringTemplateId: luz.id });
  assert.equal(buildRecurringCandidates('expense', month, [], [luz], [updated])[0].alreadyPosted, true);
});

test('clamps dates for February and retains day 31 as the default for later months', () => {
  const february = dayjs('2027-02-01');
  const item = { ...template(), day: 31 };
  assert.equal(dateForRecurringDay(february, 31), '2027-02-28');
  assert.equal(dateForRecurringDay(dayjs('2028-02-01'), 31), '2028-02-29');
  const saved = updatedRecurringTemplates([item], [selection(item, 400, '2027-02-28')], february)[0];
  assert.equal(saved.day, 31);
  const march = buildRecurringCandidates('expense', dayjs('2027-03-01'), [
    expense('2027-02-28', 'Contas', 'Luz', 400, { recurringTemplateId: item.id }),
  ], [saved], []);
  assert.equal(dateForRecurringDay(dayjs('2027-03-01'), march[0].template.day), '2027-03-31');
});

test('validates positive cent values and real dates belonging to the selected month', () => {
  assert.equal(isValidRecurringSelection(selection(template(), 0.29), month), true);
  assert.equal(isValidRecurringSelection(selection(template(), 166.66), month), true);
  for (const value of [0, -5, NaN, Infinity, 1.001]) {
    assert.equal(isValidRecurringSelection(selection(template(), value), month), false);
  }
  assert.equal(isValidRecurringSelection(selection(template(), 20, '2026-09-15'), month), false);
  assert.equal(isValidRecurringSelection(selection(template(), 20, '2026-10-32'), month), false);
  assert.equal(isValidRecurringSelection(selection(template(), 20, ''), month), false);
  assert.equal(isValidRecurringSelection(selection(template(), 20, '2027-02-31'), dayjs('2027-02-01')), false);
});

test('reviewing an older month does not overwrite newer saved defaults', () => {
  const newer = { ...template(), value: 500, day: 20, lastUsedMonth: '2026-12' };
  const saved = updatedRecurringTemplates([newer], [selection(newer, 300)], month)[0];
  assert.equal(saved.value, 500);
  assert.equal(saved.day, 20);
  assert.equal(saved.lastUsedMonth, '2026-12');
  const later = expense('2026-09-18', 'Contas', 'Luz', 450);
  assert.equal(buildRecurringCandidates('expense', month, [later], [template()], [])[0].template.value, 450);
});

// A transactional in-memory Firestore double: no test reads/writes the real account.
function firestoreDouble() {
  const store = new Map();
  let pending = Promise.resolve();
  let failBeforeCommit = false;
  let loseAcknowledgement = false;
  const snapshot = ref => ({ id: ref.id, exists: () => store.has(ref.path), data: () => store.get(ref.path) });
  const api = {
    collection: (_db, name) => ({ path: name }),
    doc: (_db, name, id) => ({ path: `${name}/${id}`, id }),
    where: (field, operator, value) => ({ field, operator, value }),
    query: (ref, ...constraints) => ({ ...ref, constraints }),
    getDoc: async ref => snapshot(ref),
    getDocs: async query => ({ docs: Array.from(store.entries()).filter(([key, data]) =>
      key.startsWith(`${query.path}/`) && query.constraints.every(({ field, operator, value }) =>
        operator === 'in' ? value.includes(data[field]) : data[field] === value,
      ),
    ).map(([key]) => snapshot({ path: key, id: key.split('/')[1] })) }),
    runTransaction: async (_db, callback) => {
      const previous = pending;
      let release;
      pending = new Promise(resolve => { release = resolve; });
      await previous;
      try {
        const writes = [];
        const result = await callback({
          get: async ref => snapshot(ref),
          set: (ref, data, options) => writes.push([ref, data, options]),
        });
        if (failBeforeCommit) { failBeforeCommit = false; throw new Error('offline'); }
        for (const [ref, data, options] of writes) {
          store.set(ref.path, options?.merge ? { ...store.get(ref.path), ...data } : data);
        }
        if (loseAcknowledgement) { loseAcknowledgement = false; throw new Error('lost acknowledgement'); }
        return result;
      } finally { release(); }
    },
  };
  const filename = path.resolve(__dirname, '../src/providers/recurring/services.ts');
  const serviceModule = new Module(filename, module);
  serviceModule.filename = filename;
  serviceModule.paths = module.paths;
  serviceModule.require = name => name === 'firebase/firestore' ? api
    : name.endsWith('firebaseConfig') ? { database: {} } : Module.prototype.require.call(serviceModule, name);
  require.extensions['.ts'](serviceModule, filename);
  return {
    store, services: serviceModule.exports,
    failBeforeCommit: () => { failBeforeCommit = true; },
    loseAcknowledgement: () => { loseAcknowledgement = true; },
  };
}

test('loading scopes history and settings to the signed-in user and selected month', async () => {
  const { store, services } = firestoreDouble();
  const seed = (id, entry) => store.set(`invoices/${id}`, { ...entry, addDate: entry.addDate.toString() });
  seed('april', expense('2026-04-15', 'Contas', 'Luz', 200));
  seed('march', expense('2026-03-15', 'Contas', 'Luz', 190));
  seed('current', expense('2026-10-15', 'Contas', 'Luz', 385));
  seed('other-user', expense('2026-09-15', 'Contas', 'Luz', 300, { userId: 'other' }));
  store.set('userSettings/family', { recurringExpenseTemplates: [template()] });
  const data = await services.loadRecurringData('family', 'expense', month);
  assert.equal(data.history.length, 1);
  assert.equal(data.history[0].id, 'april');
  assert.equal(data.current.length, 1);
  assert.equal(data.templates.length, 1);
  await assert.rejects(() => services.loadRecurringData('', 'expense', month));
});

test('launch creates a complete batch, preserves category settings and saves monthly defaults', async () => {
  const { store, services } = firestoreDouble();
  store.set('userSettings/family', { expenseCategories: ['Custom'], recurringRevenueTemplates: [template('Salário', 'Lu', 3700, 'revenue')] });
  const result = await services.launchRecurringTransactions('family', 'expense', month, [
    selection(), selection(template('Contas', 'Internet', 110), 120, '2026-10-20'),
  ]);
  assert.equal(result.createdCount, 2);
  assert.equal(result.transactions.length, 2);
  assert.equal(result.transactions[1].value, 120);
  assert.equal(result.transactions[1].addDate.format('YYYY-MM-DD'), '2026-10-20');
  const settings = store.get('userSettings/family');
  assert.deepEqual(settings.expenseCategories, ['Custom']);
  assert.equal(settings.recurringRevenueTemplates.length, 1);
  assert.equal(settings.recurringExpenseTemplates.length, 2);
  assert.equal(settings.recurringExpenseTemplates[1].day, 20);
});

test('concurrent confirmations and edited retries cannot create the same monthly item twice', async () => {
  const { store, services } = firestoreDouble();
  const results = await Promise.all([
    services.launchRecurringTransactions('family', 'expense', month, [selection()]),
    services.launchRecurringTransactions('family', 'expense', month, [selection(template(), 500, '2026-10-20')]),
  ]);
  assert.equal(results.reduce((sum, result) => sum + result.createdCount, 0), 1);
  assert.equal(Array.from(store.keys()).filter(key => key.startsWith('invoices/')).length, 1);
  const existing = results[0].transactions[0];
  assert.equal(results[1].transactions[0].id, existing.id);
  assert.equal(results[1].transactions[0].value, existing.value);
  assert.equal(store.get('userSettings/family').recurringExpenseTemplates[0].value, existing.value);
});

test('launches and remembers the monthly restaurant amount without mistaking small purchases for duplicates', async () => {
  const { store, services } = firestoreDouble();
  const manual = expense('2026-10-02', 'Restaurante', 'Almoço', 90);
  store.set('invoices/manual', { ...manual, addDate: manual.addDate.toString() });
  const monthly = buildRecurringCandidates('expense', month, [
    expense('2026-08-15', 'Restaurante', 'Almoço', 1500),
    expense('2026-08-20', 'Restaurante', 'Almoço', 80),
    expense('2026-09-15', 'Restaurante', 'Almoço', 1550),
    expense('2026-09-25', 'Restaurante', 'Almoço', 100),
  ], [], [manual])[0];
  const result = await services.launchRecurringTransactions('family', 'expense', month, [selection(monthly.template)]);
  assert.equal(result.createdCount, 1);
  assert.equal(result.transactions[0].value, 1550);
  assert.equal(store.get('invoices/manual').value, 90);
  assert.equal(store.get('userSettings/family').recurringExpenseTemplates[0].matchValue, true);
  const repeated = await services.launchRecurringTransactions('family', 'expense', month, [selection(monthly.template)]);
  assert.equal(repeated.createdCount, 0);
  assert.equal(repeated.transactions[0].id, result.transactions[0].id);
  const nextMonth = await services.loadRecurringData('family', 'expense', dayjs('2026-11-01'));
  assert.equal(nextMonth.templates[0].matchValue, true);
});

test('recognizes a manual launch at confirmation time and keeps it unchanged', async () => {
  const { store, services } = firestoreDouble();
  const manual = expense('2026-10-18', 'Contas', 'Luz', 700);
  store.set('invoices/manual', { ...manual, addDate: manual.addDate.toString() });
  const result = await services.launchRecurringTransactions('family', 'expense', month, [selection()]);
  assert.equal(result.createdCount, 0);
  assert.equal(result.skippedCount, 1);
  assert.equal(result.transactions[0].id, 'manual');
  assert.equal(result.transactions[0].value, 700);
  assert.equal(store.get('userSettings/family').recurringExpenseTemplates[0].value, 700);
});

test('launches separate unnamed subscriptions, retains stable identities and avoids duplicate retries', async () => {
  const { store, services } = firestoreDouble();
  const history = [
    expense('2026-08-15', 'Assinaturas Digitais', '', 200),
    expense('2026-08-20', 'Assinaturas Digitais', '', 50),
    expense('2026-09-15', 'Assinaturas Digitais', '', 210),
    expense('2026-09-20', 'Assinaturas Digitais', '', 50),
  ];
  const candidates = buildRecurringCandidates('expense', month, history, [], []).filter(item => item.suggested);
  const selections = candidates.map(item => selection(item.template));
  const result = await services.launchRecurringTransactions('family', 'expense', month, selections);
  assert.equal(result.createdCount, 2);
  const repeated = await services.launchRecurringTransactions('family', 'expense', month, selections);
  assert.equal(repeated.createdCount, 0);
  const nextMonth = dayjs('2026-11-01');
  const data = await services.loadRecurringData('family', 'expense', nextMonth);
  assert.equal(data.templates.length, 2);
  assert.ok(data.templates.every(item => Number.isFinite(item.valueAnchor)));
  const next = buildRecurringCandidates('expense', nextMonth, [
    ...data.history, expense('2026-10-25', 'Assinaturas Digitais', '', 10),
  ], data.templates, []);
  const saved = next.filter(item => item.saved);
  assert.deepEqual(saved.map(item => item.template.value), [210, 50]);
  assert.deepEqual(saved.map(item => item.template.id), candidates.map(item => item.template.id));
  assert.equal(next.some(item => item.suggested && !item.saved), false);
  await services.stopRecurringTemplate('family', saved[0].template);
  assert.equal(store.get('userSettings/family').recurringExpenseTemplates.filter(item => item.active).length, 1);
});

test('a failed batch commits nothing and a retry after a lost response creates no duplicates', async () => {
  const { store, services, failBeforeCommit, loseAcknowledgement } = firestoreDouble();
  failBeforeCommit();
  await assert.rejects(() => services.launchRecurringTransactions('family', 'expense', month, [selection()]));
  assert.equal(store.size, 0);
  loseAcknowledgement();
  await assert.rejects(() => services.launchRecurringTransactions('family', 'expense', month, [selection()]));
  const result = await services.launchRecurringTransactions('family', 'expense', month, [selection()]);
  assert.equal(result.createdCount, 0);
  assert.equal(result.transactions.length, 1);
  assert.equal(Array.from(store.keys()).filter(key => key.startsWith('invoices/')).length, 1);
});

test('revenue creation is isolated and stopping a template preserves past transactions', async () => {
  const { store, services } = firestoreDouble();
  const salary = template('Salário', 'Filipe', 7800, 'revenue');
  const result = await services.launchRecurringTransactions('family', 'revenue', month, [selection(salary, 8000)]);
  assert.equal(result.createdCount, 1);
  assert.equal(result.transactions[0].revenueCategory, 'Salário');
  assert.equal(result.transactions[0].invoiceCategory, undefined);
  assert.equal(Array.from(store.keys()).filter(key => key.startsWith('invoices/')).length, 0);
  await services.stopRecurringTemplate('family', salary);
  assert.equal(store.get('userSettings/family').recurringRevenueTemplates[0].active, false);
  assert.equal(Array.from(store.keys()).filter(key => key.startsWith('revenues/')).length, 1);
});

test('rejects malformed selections before writing any data', async () => {
  const { store, services } = firestoreDouble();
  for (const selections of [[], [selection(template(), 0)], [selection(), selection()], [selection(template('Salário', 'Lu', 3700, 'revenue'))]]) {
    await assert.rejects(() => services.launchRecurringTransactions('family', 'expense', month, selections));
  }
  assert.equal(store.size, 0);
});
