const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const Module = require('node:module');
const ts = require('typescript');
const dayjs = require('dayjs');
require.extensions['.ts'] = (module, filename) => module._compile(ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
  fileName: filename, compilerOptions: { module: ts.ModuleKind.CommonJS, esModuleInterop: true, target: ts.ScriptTarget.ES2020 },
}).outputText, filename);
const { getExpenseSeries, isFutureSeriesExpense } = require('../src/utils/expenseSeries.ts');
const recurringId = '["expense","contas","internet"]';
const expense = (id, month, extra = {}) => ({
  id, userId: 'family', invoiceCategory: 'Contas', description: 'Internet', value: 100,
  addDate: dayjs(`${month}-05`), addDateFormatted: dayjs(`${month}-05`).format('MM/YYYY'), ...extra,
});
const parcel = (number, month, purchase = 'purchase', extra = {}) => expense(`installment-${purchase}-${number}`, month, {
  installmentPurchaseId: purchase, installmentNumber: number, installmentCount: 4, ...extra,
});
const recurring = (id, month, extra = {}) => expense(id, month, { recurringTemplateId: recurringId, isMonthlyFixed: true, ...extra });

function backendDouble() {
  const store = new Map();
  let failBeforeCommit = false, loseAcknowledgement = false;
  let beforeTransaction;
  const snapshot = ref => ({ id: ref.id, exists: () => store.has(ref.path), data: () => store.get(ref.path) });
  const api = {
    collection: (_db, name) => ({ path: name }), doc: (_db, name, id) => ({ path: `${name}/${id}`, id }),
    where: (field, _operator, value) => ({ field, value }), query: (ref, ...constraints) => ({ ...ref, constraints }),
    getDocsFromServer: async query => ({ docs: [...store.entries()].filter(([key, data]) => key.startsWith(query.path+'/')
      && query.constraints.every(({ field, value }) => data[field] === value))
      .map(([key]) => snapshot({ path: key, id: key.split('/')[1] })) }),
    runTransaction: async (_db, callback) => {
      beforeTransaction?.(); beforeTransaction = undefined;
      const writes = [];
      const result = await callback({
        get: async ref => { assert.equal(writes.length, 0, 'all reads must precede deletes'); return snapshot(ref); },
        delete: ref => writes.push({ ref, remove: true }),
        set: (ref, data, options) => writes.push({ ref, data, options }),
      });
      if (failBeforeCommit) { failBeforeCommit = false; throw new Error('offline'); }
      for (const write of writes) {
        if (write.remove) store.delete(write.ref.path);
        else store.set(write.ref.path, write.options?.merge ? { ...store.get(write.ref.path), ...write.data } : write.data);
      }
      if (loseAcknowledgement) { loseAcknowledgement = false; throw new Error('lost acknowledgement'); }
      return result;
    },
  };
  const filename = path.resolve(__dirname,'../src/providers/invoices/deletion.ts');
  const moduleInstance = new Module(filename,module);
  moduleInstance.filename = filename; moduleInstance.paths = module.paths;
  moduleInstance.require = name => name === 'firebase/firestore' ? api : name.endsWith('firebaseConfig') ? { database: {} } : Module.prototype.require.call(moduleInstance,name);
  require.extensions['.ts'](moduleInstance,filename);
  return {
    store, services: moduleInstance.exports,
    seed: (...entries) => entries.forEach(entry => store.set('invoices/'+entry.id, { ...entry, addDate: entry.addDate.toString() })),
    fail: () => { failBeforeCommit = true; }, loseAcknowledgement: () => { loseAcknowledgement = true; },
    beforeTransaction: callback => { beforeTransaction = callback; },
  };
}

test('future installments are scoped to the purchase/account and preserve past and same-month entries', async () => {
  const { seed, store, services } = backendDouble();
  const current = parcel(2,'2026-11');
  const future = [parcel(3,'2026-12'),parcel(4,'2027-01')];
  const kept = [parcel(1,'2026-10'), parcel(5,'2026-11', 'purchase', { installmentCount: 5 }), parcel(1,'2026-12','other-purchase'),
    parcel(6,'2026-12','purchase',{ userId: 'other', installmentCount: 6 })];
  seed(current,...future,...kept);
  const preview = await services.getFutureSeriesExpenses('family',current);
  assert.deepEqual(preview.map(entry=>entry.id),future.map(entry=>entry.id));
  const deleted = await services.deleteExpenseAndFuture('family',current,preview.map(entry=>entry.id));
  assert.equal(deleted.length,3);
  assert.ok(kept.every(entry => store.has('invoices/'+entry.id)));
  assert.ok([current,...future].every(entry => !store.has('invoices/'+entry.id)));
});

test('legacy purchase prefixes work; descriptions and manual monthly markings never define a deletion group', async () => {
  const { seed, services } = backendDouble();
  const legacy = (number, month) => { const entry = parcel(number,month); delete entry.installmentPurchaseId; return entry; };
  const current = legacy(2,'2026-11');
  seed(current,legacy(3,'2026-12'),expense('manual','2026-12',{ isMonthlyFixed: true }));
  assert.equal((await services.getFutureSeriesExpenses('family',current)).length,1);
  assert.equal(getExpenseSeries(expense('manual','2026-11',{ isMonthlyFixed: true })),null);
  assert.equal(getExpenseSeries(expense('manual-parcel','2026-11',{ description: 'Parcela 1/3' })),null);
});

test('recurrence deletion removes current/future records, stops suggestions and preserves other settings and history', async () => {
  const { seed, store, services } = backendDouble();
  const current = recurring('current','2026-11'), future = recurring('future','2026-12'), past = recurring('past','2026-10');
  seed(current,future,past,expense('unlinked','2026-12'),recurring('other-user','2026-12',{ userId:'other' }));
  store.set('userSettings/family',{ expenseCategories:['Custom'], recurringRevenueTemplates:[{ id:'salary',active:true }],
    recurringExpenseTemplates:[{ id:recurringId,active:true },{ id:'other-template',active:true }] });
  await services.deleteExpenseAndFuture('family',current,[future.id]);
  assert.ok(!store.has('invoices/current') && !store.has('invoices/future'));
  assert.ok(store.has('invoices/past') && store.has('invoices/unlinked') && store.has('invoices/other-user'));
  const settings = store.get('userSettings/family');
  assert.equal(settings.recurringExpenseTemplates[0].active,false);
  assert.equal(settings.recurringExpenseTemplates[1].active,true);
  assert.deepEqual(settings.expenseCategories,['Custom']);
  assert.equal(settings.recurringRevenueTemplates[0].active,true);
});

test('future means the saved accounting month, including year boundaries and timezone-independent dates', () => {
  const current = recurring('current','2026-11');
  assert.equal(isFutureSeriesExpense(current,recurring('future','2026-12',{ addDate: dayjs('2026-11-30T23:30:00') })),true);
  assert.equal(isFutureSeriesExpense(current,recurring('same','2026-11',{ addDate: dayjs('2026-12-01') })),false);
  assert.equal(isFutureSeriesExpense(current,recurring('invalid','2026-12',{ addDateFormatted:'bad' })),false);
  assert.equal(isFutureSeriesExpense(current,recurring('year','2027-01')),true);
});

test('unknown newly added future entries require another review and cause no deletion', async () => {
  const { seed, store, services } = backendDouble();
  const current = parcel(2,'2026-11'), first = parcel(3,'2026-12'), newer = parcel(4,'2027-01');
  seed(current,first);
  const preview = await services.getFutureSeriesExpenses('family',current);
  seed(newer);
  await assert.rejects(()=>services.deleteExpenseAndFuture('family',current,preview.map(entry=>entry.id)), /novos lançamentos/);
  assert.equal(store.size,3);
});

test('transaction rechecks moved entries and never deletes an entry rescheduled into the past', async () => {
  const backend = backendDouble();
  const current = parcel(2,'2026-11'), future = parcel(3,'2026-12');
  backend.seed(current,future);
  backend.beforeTransaction(()=>backend.seed(parcel(3,'2026-10')));
  const deleted = await backend.services.deleteExpenseAndFuture('family',current,[future.id]);
  assert.deepEqual(deleted,[current.id]);
  assert.ok(backend.store.has('invoices/'+future.id));
});

test('atomic failure leaves every record intact; retrying a lost acknowledgement is idempotent', async () => {
  const backend = backendDouble();
  const current = parcel(2,'2026-11'), future = parcel(3,'2026-12');
  backend.seed(current,future);
  backend.fail();
  await assert.rejects(()=>backend.services.deleteExpenseAndFuture('family',current,[future.id]));
  assert.equal(backend.store.size,2);
  backend.loseAcknowledgement();
  await assert.rejects(()=>backend.services.deleteExpenseAndFuture('family',current,[future.id]));
  assert.equal(backend.store.size,0);
  assert.deepEqual(await backend.services.deleteExpenseAndFuture('family',current,[future.id]),[]);
});

test('rejects another account, pending/unlinked expenses, changed target groups, and a missing recurrence template', async () => {
  const backend = backendDouble();
  const current = parcel(2,'2026-11'), future = parcel(3,'2026-12');
  backend.seed(current,future);
  await assert.rejects(()=>backend.services.deleteExpenseAndFuture('other',current,[future.id]));
  await assert.rejects(()=>backend.services.deleteExpenseAndFuture('family',{...current,pendingSync:true},[future.id]));
  await assert.rejects(()=>backend.services.deleteExpenseAndFuture('family',expense('manual','2026-11'),[]));
  backend.beforeTransaction(()=>backend.store.set('invoices/'+current.id,{ ...backend.store.get('invoices/'+current.id), userId:'other' }));
  await assert.rejects(()=>backend.services.deleteExpenseAndFuture('family',current,[future.id]), /mudou/);
  assert.equal(backend.store.size,2);
  const repeated = recurring('recurring-current','2026-11');
  backend.seed(repeated);
  await assert.rejects(()=>backend.services.deleteExpenseAndFuture('family',repeated,[]), /recorrência não está disponível/);
  assert.ok(backend.store.has('invoices/'+repeated.id));
});

test('an oversized recurrence is refused before any record is removed', async () => {
  const backend = backendDouble();
  const current = recurring('current','2026-11');
  const future = Array.from({length:499},(_,index)=>recurring('future-'+index,'2026-12'));
  backend.seed(current,...future);
  backend.store.set('userSettings/family',{ recurringExpenseTemplates:[{id:recurringId,active:true}] });
  await assert.rejects(()=>backend.services.deleteExpenseAndFuture('family',current,future.map(entry=>entry.id)), /limite/);
  assert.equal(backend.store.size,501);
});
