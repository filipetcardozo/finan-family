const { test, beforeEach } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const Module = require('node:module');
const ts = require('typescript');
const dayjs = require('dayjs');
require('fake-indexeddb/auto');

global.window = new EventTarget();
global.BroadcastChannel = undefined;
const loadTypeScript = (module, filename) => module._compile(ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, esModuleInterop: true, target: ts.ScriptTarget.ES2020, jsx: ts.JsxEmit.ReactJSX },
}).outputText, filename);
require.extensions['.ts'] = require.extensions['.tsx'] = loadTypeScript;
const loadWith = (relativePath, overrides = {}) => {
  const filename = path.resolve(__dirname, relativePath);
  const instance = new Module(filename, module);
  instance.filename = filename;
  instance.paths = module.paths;
  instance.require = name => name in overrides ? overrides[name] : Module.prototype.require.call(instance, name);
  loadTypeScript(instance, filename);
  return instance.exports;
};
const store = require('../src/providers/offline/store.ts');
const { mergeMonthlyTransactions } = require('../src/utils/offlineTransactions.ts');
const { createClientId } = require('../src/utils/clientId.ts');

test('lease identifiers work without randomUUID, without crypto, and with native randomUUID', () => {
  const descriptor = Object.getOwnPropertyDescriptor(globalThis, 'crypto');
  try {
    Object.defineProperty(globalThis, 'crypto', { configurable: true, value: { randomUUID: () => 'native-id' } });
    assert.equal(createClientId(), 'native-id');
    Object.defineProperty(globalThis, 'crypto', { configurable: true, value: { getRandomValues: bytes => bytes.fill(42) } });
    assert.equal(createClientId(), '2a'.repeat(16));
    Object.defineProperty(globalThis, 'crypto', { configurable: true, value: undefined });
    const ids = Array.from({ length: 100 }, () => createClientId());
    assert.equal(new Set(ids).size, ids.length);
    assert.ok(ids.every(id => typeof id === 'string' && id.length > 10));
  } finally {
    if (descriptor) Object.defineProperty(globalThis, 'crypto', descriptor);
    else delete globalThis.crypto;
  }
});

beforeEach(async () => {
  await store.listLaunches('setup');
  await new Promise((resolve, reject) => {
    const open = indexedDB.open('finan-family-offline', 1);
    open.onsuccess = () => {
      const database = open.result;
      const transaction = database.transaction('launches', 'readwrite');
      transaction.objectStore('launches').clear();
      transaction.oncomplete = () => { database.close(); resolve(); };
      transaction.onabort = () => reject(transaction.error);
    };
    open.onerror = () => reject(open.error);
  });
});

const expense = (extra = {}) => ({
  id: 'expense', userId: 'family', invoiceCategory: 'Contas', description: 'Internet', value: 100,
  addDate: dayjs('2026-11-05'), addDateFormatted: '11/2026', ...extra,
});

function backendDouble() {
  const documents = new Map();
  let currentUser = 'family';
  let generatedId = 0;
  let failBeforeCommit;
  let loseResponse = false;
  let commits = 0;
  let pending = Promise.resolve();
  const api = {
    collection: (_db, name) => ({ path: name }),
    doc: (dbOrRef, name, id) => id === undefined
      ? { path: `${dbOrRef.path}/auto-${++generatedId}`, id: `auto-${generatedId}` }
      : { path: `${name}/${id}`, id },
    runTransaction: async (_db, callback) => {
      const previous = pending;
      let release;
      pending = new Promise(resolve => { release = resolve; });
      await previous;
      try {
        const writes = [];
        await callback({
          get: async ref => ({ exists: () => documents.has(ref.path), data: () => documents.get(ref.path) }),
          set: (ref, data) => writes.push([ref.path, data]),
        });
        if (failBeforeCommit) { const error = failBeforeCommit; failBeforeCommit = undefined; throw error; }
        commits++;
        for (const [id, data] of writes) documents.set(id, data);
        if (loseResponse) { loseResponse = false; throw Object.assign(new Error('Lost response'), { code: 'unavailable' }); }
      } finally { release(); }
    },
  };
  const services = loadWith('../src/providers/offline/launches.ts', {
    'firebase/firestore': api,
    'firebase/auth': { getAuth: () => ({ currentUser: currentUser ? { uid: currentUser } : null }) },
    '../../../firebaseConfig': { database: {}, firebaseApp: {} },
    './store': store,
  });
  const installments = loadWith('../src/providers/invoices/installments.ts', {
    'firebase/firestore': api,
    '../../../firebaseConfig': { database: {} },
    '../offline/launches': services,
  });
  const { syncPendingLaunches } = loadWith('../src/providers/offline/sync.ts', { './store': store, './launches': services });
  return {
    documents, services, installments, syncPendingLaunches, api,
    current: () => currentUser,
    setUser: uid => { currentUser = uid; },
    failNext: code => { failBeforeCommit = Object.assign(new Error(code), { code }); },
    loseResponse: () => { loseResponse = true; },
    commitCount: () => commits,
    sync: (owner = 'tab-a') => syncPendingLaunches('family', owner, () => currentUser === 'family', () => true),
  };
}

test('offline launch commits locally, survives reopening the store, and includes an actual Dayjs date', async () => {
  const backend = backendDouble();
  const entries = await backend.services.queueTransactions('invoices', [expense({ pendingSync: true })]);
  assert.equal(entries[0].pendingSync, true);
  assert.equal(entries[0].addDate.format('YYYY-MM-DD'), '2026-11-05');
  assert.equal(backend.documents.size, 0);
  const reopenedStore = loadWith('../src/providers/offline/store.ts');
  const queue = await reopenedStore.listLaunches('family');
  assert.equal(queue.length, 1);
  assert.equal(queue[0].documents[0].addDate, expense().addDate.toString());
  assert.ok(!('pendingSync' in queue[0].documents[0]));
});

test('reopening with connection syncs queued expenses, revenues and every month of an installment purchase', async () => {
  const backend = backendDouble();
  await backend.services.queueTransactions('invoices', [expense()]);
  await backend.services.queueTransactions('revenues', [expense({ id: 'income', revenueCategory: 'Salário' })]);
  await backend.installments.queueInstallmentInvoices(expense(), 3, 'purchase');
  assert.equal((await store.listLaunches('family')).length, 3);
  await backend.sync();
  assert.equal((await store.listLaunches('family')).length, 0);
  assert.equal(backend.documents.size, 5);
  assert.equal(backend.documents.get('invoices/installment-purchase-3').addDateFormatted, '01/2027');
  assert.equal(backend.documents.get('revenues/income').revenueCategory, 'Salário');
});

test('a repeated local submission preserves the saved values and one operation', async () => {
  const backend = backendDouble();
  await backend.services.queueTransactions('invoices', [expense()]);
  const repeated = await backend.services.queueTransactions('invoices', [expense({ value: 900 })]);
  assert.equal((await store.listLaunches('family')).length, 1);
  assert.equal(repeated[0].value, 100);
  await backend.sync();
  assert.equal(backend.documents.size, 1);
});

test('an interrupted connection leaves the entire purchase pending, then retries atomically', async () => {
  const backend = backendDouble();
  await backend.installments.queueInstallmentInvoices(expense(), 3, 'purchase');
  backend.failNext('unavailable');
  await backend.sync();
  assert.equal(backend.documents.size, 0);
  const [pending] = await store.listLaunches('family');
  assert.equal(pending.attempts, 1);
  assert.equal(pending.documents.length, 3);
  assert.ok(pending.nextAttemptAt > Date.now());
  await store.retryLaunches('family');
  await backend.sync();
  assert.equal(backend.documents.size, 3);
  assert.equal((await store.listLaunches('family')).length, 0);
});

test('a lost server acknowledgement cannot duplicate or overwrite an edited installment on retry', async () => {
  const backend = backendDouble();
  await backend.installments.queueInstallmentInvoices(expense(), 3, 'purchase');
  backend.loseResponse();
  await backend.sync();
  assert.equal(backend.documents.size, 3);
  assert.equal((await store.listLaunches('family')).length, 1);
  const key = 'invoices/installment-purchase-2';
  backend.documents.set(key, { ...backend.documents.get(key), value: 250 });
  backend.documents.delete('invoices/installment-purchase-3');
  await store.retryLaunches('family');
  await backend.sync();
  assert.equal(backend.documents.size, 2);
  assert.equal(backend.documents.get(key).value, 250);
  assert.equal((await store.listLaunches('family')).length, 0);
});

test('two tabs cannot claim an operation together and an abandoned lease can be recovered', async () => {
  const backend = backendDouble();
  await backend.services.queueTransactions('invoices', [expense()]);
  const now = Date.now();
  const claimed = await Promise.all([store.claimLaunch('family', 'one', now), store.claimLaunch('family', 'two', now)]);
  assert.equal(claimed.filter(Boolean).length, 1);
  assert.equal(await store.claimLaunch('family', 'three', now + 119_999), undefined);
  const recovered = await store.claimLaunch('family', 'three', now + 120_001);
  assert.equal(recovered.leaseOwner, 'three');
  await store.finishLaunch(recovered.id, 'one');
  assert.equal((await store.listLaunches('family')).length, 1, 'stale tab cannot remove a recovered operation');
  await store.finishLaunch(recovered.id, 'three');
  assert.equal((await store.listLaunches('family')).length, 0);
});

test('concurrent synchronizers create one set of documents', async () => {
  const backend = backendDouble();
  await backend.installments.queueInstallmentInvoices(expense(), 3, 'purchase');
  await Promise.all([backend.sync('one'), backend.sync('two')]);
  assert.equal(backend.documents.size, 3);
  assert.equal(backend.commitCount(), 1);
});

test('pending launches stay isolated by account and are not sent after sign-out', async () => {
  const backend = backendDouble();
  await backend.services.queueTransactions('invoices', [expense()]);
  backend.setUser('other');
  await backend.services.queueTransactions('invoices', [expense({ id: 'other-expense', userId: 'other' })]);
  await backend.sync();
  assert.equal(backend.documents.size, 0);
  assert.equal((await store.listLaunches('family')).length, 1);
  assert.equal((await store.listLaunches('other')).length, 1);
  backend.setUser('');
  await assert.rejects(() => backend.services.queueTransactions('invoices', [expense()]));
  backend.setUser('family');
  await backend.sync();
  assert.equal(backend.documents.size, 1);
  assert.equal((await store.listLaunches('other')).length, 1);
});

test('server refusals retain the local data, expose an error and let other launches sync', async () => {
  const backend = backendDouble();
  await backend.services.queueTransactions('invoices', [expense()]);
  await backend.services.queueTransactions('invoices', [expense({ id: 'second' })]);
  backend.failNext('permission-denied');
  await backend.sync();
  const [refused] = await store.listLaunches('family');
  assert.equal(refused.documents[0].id, 'expense');
  assert.match(refused.error, /Sem permissão/);
  assert.equal(backend.documents.size, 1);
  await store.retryLaunches('family', false);
  assert.ok((await store.listLaunches('family'))[0].error, 'focusing/reconnecting must not clear a server refusal');
  await store.retryLaunches('family');
  await backend.sync();
  assert.equal(backend.documents.size, 2);
  assert.equal((await store.listLaunches('family')).length, 0);
});

test('no write or claim happens without connection', async () => {
  const backend = backendDouble();
  await backend.services.queueTransactions('invoices', [expense()]);
  await backend.syncPendingLaunches('family', 'tab', () => true, () => false);
  assert.equal(backend.commitCount(), 0);
  assert.equal((await store.listLaunches('family'))[0].leaseOwner, undefined);
});

test('monthly totals merge pending data once and never leak other months, accounts or kinds', async () => {
  const backend = backendDouble();
  await backend.installments.queueInstallmentInvoices(expense(), 3, 'purchase');
  const queue = await store.listLaunches('family');
  const serverEntry = expense({ id: 'installment-purchase-1', value: 10 });
  const merged = mergeMonthlyTransactions([serverEntry, expense({ id: 'ordinary', value: 20 })], queue, 'invoices', 'family', '11/2026');
  assert.equal(merged.length, 2);
  assert.equal(merged.reduce((sum, entry) => sum + entry.value, 0), 120);
  assert.equal(merged.find(entry => entry.id === serverEntry.id).pendingSync, true);
  assert.equal(mergeMonthlyTransactions([], queue, 'invoices', 'family', '12/2026').length, 1);
  assert.equal(mergeMonthlyTransactions([], queue, 'invoices', 'other', '11/2026').length, 0);
  assert.equal(mergeMonthlyTransactions([], queue, 'revenues', 'family', '11/2026').length, 0);
  assert.equal(mergeMonthlyTransactions([], queue, 'invoices', 'family', '02/2027').length, 0);
});

test('invalid, mixed-account and non-cent values never reach local storage', async () => {
  const backend = backendDouble();
  for (const invalid of [expense({ value: NaN }), expense({ value: 1.001 }), expense({ userId: 'other' }),
    expense({ addDate: null }), expense({ addDateFormatted: '12/2026' }), expense({ invoiceCategory: '' })]) {
    await assert.rejects(() => backend.services.queueTransactions('invoices', [invalid]));
  }
  await assert.rejects(() => backend.services.queueTransactions('invoices', [expense(), expense()]));
  assert.equal((await store.listLaunches('family')).length, 0);
});

test('storage failure never reports a launch as saved or sends it to the server', async () => {
  const backend = backendDouble();
  const failingStore = loadWith('../src/providers/offline/store.ts');
  const original = global.indexedDB;
  global.indexedDB = undefined;
  try {
    await assert.rejects(() => failingStore.saveLaunch({ id: 'failure' }), /armazenamento local/);
    assert.equal(backend.documents.size, 0);
  } finally { global.indexedDB = original; }
});

test('pending expenses show their status and cannot be edited or deleted before syncing', () => {
  const testWindow = global.window;
  delete global.window;
  const React = require('react');
  const { renderToStaticMarkup } = require('react-dom/server');
  const { ExpensesTable } = require('../src/components/ExpensesTable.tsx');
  const html = renderToStaticMarkup(React.createElement(ExpensesTable, { invoices: [expense({ pendingSync: true })], onEdit() {}, onDelete() {} }));
  assert.match(html, /Pendente/);
  assert.equal((html.match(/<button[^>]*disabled=""/g) || []).length, 2);
  global.window = testWindow;
});
