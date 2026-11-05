const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const Module = require('node:module');
const ts = require('typescript');
const React = require('react');
const { renderToStaticMarkup } = require('react-dom/server');
const { act, create } = require('react-test-renderer');
const dayjs = require('dayjs');
const compile = (module, filename) => module._compile(ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
  fileName: filename,
  compilerOptions: { module: ts.ModuleKind.CommonJS, esModuleInterop: true, target: ts.ScriptTarget.ES2020, jsx: ts.JsxEmit.ReactJSX },
}).outputText, filename);
require.extensions['.ts'] = require.extensions['.tsx'] = compile;
const loadWith = (file, overrides) => {
  const filename = path.resolve(__dirname, file);
  const instance = new Module(filename, module);
  instance.filename = filename; instance.paths = module.paths;
  instance.require = name => name in overrides ? overrides[name] : Module.prototype.require.call(instance, name);
  compile(instance, filename);
  return instance.exports;
};
const { RevenuesTable } = require('../src/components/RevenuesTable.tsx');
const { ExpensesTable } = require('../src/components/ExpensesTable.tsx');
const { MonthlyExpensesTimeline } = require('../src/components/MonthlyExpensesTimeline.tsx');
const expense = (id = 'expense', extra = {}) => ({
  id, userId: 'family', invoiceCategory: 'Contas', description: `Descrição ${id}`, value: 100,
  addDate: dayjs('2026-11-05'), addDateFormatted: '11/2026', ...extra,
});

test('all revenues are listed without a paginator and preserve descending value order', () => {
  const revenues = Array.from({ length: 125 }, (_, index) => ({ ...expense(`revenue-${index}`), value: index + 1, revenueCategory: 'Salário' }));
  const html = renderToStaticMarkup(React.createElement(RevenuesTable, { revenues, onEdit() {}, onDelete() {} }));
  assert.equal((html.match(/<tr\b/g) || []).length, 126);
  assert.match(html, />Descrição revenue-124</);
  assert.match(html, />Descrição revenue-0</);
  assert.doesNotMatch(html, /MuiTablePagination|MuiDataGrid|rowsPerPage/);
  assert.ok(html.indexOf('>Descrição revenue-124<') < html.indexOf('>Descrição revenue-0<'));
});

test('expense/revenue rows open their own entry with mouse or keyboard; action cells stop bubbling', () => {
  for (const kind of ['expense', 'revenue']) {
    const entry = { ...expense(kind), revenueCategory: 'Salário' };
    const edited = [], deleted = [];
    let tree;
    act(() => { tree = create(React.createElement(kind === 'expense' ? ExpensesTable : RevenuesTable, {
      [kind === 'expense' ? 'invoices' : 'revenues']: [entry],
      onEdit: value => edited.push(value), onDelete: value => deleted.push(value),
    })); });
    const row = tree.root.findAllByType('tr').find(row => row.props['aria-label']);
    act(() => row.props.onClick());
    assert.deepEqual(edited, [entry]);
    const target = {};
    let prevented = false;
    act(() => row.props.onKeyDown({ key: 'Enter', target, currentTarget: target, preventDefault() { prevented = true; } }));
    assert.equal(edited.length, 2); assert.equal(prevented, true);
    const actionCell = row.findAllByType('td').at(-1);
    let stopped = false;
    actionCell.props.onClick({ stopPropagation() { stopped = true; } });
    assert.equal(stopped, true);
    const remove = row.findAllByType('button').find(button => button.props['aria-label'].startsWith('Excluir'));
    act(() => remove.props.onClick());
    assert.deepEqual(deleted, [entry.id]); assert.equal(edited.length, 2);
    act(() => tree.unmount());
  }
});

test('monthly fixed, installment and daily entries all expose direct editing without edit icons', () => {
  const entries = [expense('fixed', { isMonthlyFixed: true }), expense('parcel', { installmentNumber: 1, installmentCount: 3 }), expense('daily')];
  const edited = [];
  let tree;
  act(() => { tree = create(React.createElement(MonthlyExpensesTimeline, { expenses: entries, onEdit: value => edited.push(value) })); });
  const buttons = tree.root.findAllByType('button').filter(button => button.props['aria-label']?.startsWith('Editar despesa:'));
  assert.equal(buttons.length, 3);
  buttons.forEach(button => act(() => button.props.onClick()));
  assert.deepEqual(edited, entries);
  assert.equal(tree.root.findAll(node => node.type === 'svg' && node.props['data-testid'] === 'BorderColorOutlinedIcon').length, 0);
  act(() => tree.unmount());
});

test('pending entries and disconnected rows do not open the editor', () => {
  for (const props of [{ invoices: [expense('pending', { pendingSync: true })] }, { invoices: [expense()], canManage: false }]) {
    const edited = [];
    let tree;
    act(() => { tree = create(React.createElement(ExpensesTable, { ...props, onEdit: value => edited.push(value), onDelete() {} })); });
    const row = tree.root.findAllByType('tr').find(row => row.props['aria-label']);
    act(() => row.props.onClick());
    assert.equal(edited.length, 0);
    assert.equal(row.props.tabIndex, undefined);
    act(() => tree.unmount());
  }
});

test('the URL month is selected on the first render and rapid navigation accumulates', () => {
  const calls = [];
  const router = { isReady: true, query: { month: '2025-07' }, pathname: '/', replace: async value => { calls.push(value); } };
  const { MonthSelectedProvider, MonthSelectedContext } = loadWith('../src/contexts/monthSelected.tsx', { 'next/router': { useRouter: () => router } });
  const rendered = [];
  let value;
  function Probe() { value = React.useContext(MonthSelectedContext); rendered.push(value.dateToAnalyze.format('YYYY-MM')); return null; }
  let tree;
  act(() => { tree = create(React.createElement(MonthSelectedProvider, null, React.createElement(Probe))); });
  assert.deepEqual(rendered, ['2025-07']);
  assert.equal(value.ready, true); assert.equal(calls.length, 0);
  act(() => { value.handleNextMonth(); value.handleNextMonth(); });
  assert.deepEqual(calls.map(call => call.query.month), ['2025-08', '2025-09']);
  act(() => tree.unmount());
});

test('loading waits for authentication/month, then cache and server updates do not restart the loading screen', async () => {
  const listeners = [];
  const queue = { launches: [], loading: false };
  const { useMonthlyTransactions } = loadWith('../src/hooks/useMonthlyTransactions.ts', {
    '../../firebaseConfig': { database: {}, offlineCacheReady: Promise.resolve(true) },
    '../contexts/offlineSync': { useOfflineSync: () => queue },
    'firebase/firestore': {
      collection: (_db, name) => name, where: (field, _op, value) => ({ field, value }),
      query: (name, ...constraints) => ({ name, constraints }),
      onSnapshot: (query, next) => {
        const listener = { query, next, stopped: false };
        listeners.push(listener); return () => { listener.stopped = true; };
      },
    },
  });
  let state;
  function Probe({ uid, month, ready }) { state = useMonthlyTransactions('invoices', uid, month, ready); return null; }
  let tree;
  await act(async () => { tree = create(React.createElement(Probe, { uid: '', month: '11/2026', ready: false })); });
  assert.equal(state.loading, true); assert.equal(listeners.length, 0);
  await act(async () => { tree.update(React.createElement(Probe, { uid: 'family', month: '07/2025', ready: true })); });
  assert.equal(state.loading, true); assert.equal(listeners.length, 1);
  assert.ok(listeners[0].query.constraints.some(item => item.field === 'addDateFormatted' && item.value === '07/2025'));
  await act(async () => listeners[0].next({ docs: [] }));
  assert.equal(state.loading, false);
  const snapshot = value => ({ docs: [{ id: 'expense', data: () => ({ ...expense(), value, addDate: '2025-07-05', addDateFormatted: '07/2025' }) }] });
  await act(async () => listeners[0].next(snapshot(100)));
  assert.equal(state.loading, false); assert.equal(state.entries[0].value, 100);
  await act(async () => listeners[0].next(snapshot(200)));
  assert.equal(state.loading, false); assert.equal(state.entries[0].value, 200); assert.equal(listeners.length, 1);
  await act(async () => { tree.update(React.createElement(Probe, { uid: 'family', month: '08/2025', ready: true })); });
  assert.equal(state.loading, true); assert.equal(state.entries.length, 0); assert.equal(listeners[0].stopped, true);
  await act(async () => listeners[0].next(snapshot(900)));
  assert.equal(state.entries.length, 0, 'late responses from the old month must be ignored');
  await act(async () => listeners[1].next({ docs: [] }));
  assert.equal(state.loading, false);
  act(() => tree.unmount());
});
