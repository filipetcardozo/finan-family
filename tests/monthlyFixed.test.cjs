const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
const React = require('react');
const { renderToStaticMarkup } = require('react-dom/server');
const dayjs = require('dayjs');

require.extensions['.ts'] = require.extensions['.tsx'] = (module, filename) => module._compile(ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, esModuleInterop: true, target: ts.ScriptTarget.ES2020, jsx: ts.JsxEmit.ReactJSX },
}).outputText, filename);

const { MonthlyExpensesTimeline } = require('../src/components/MonthlyExpensesTimeline.tsx');
const { ExpensesTable } = require('../src/components/ExpensesTable.tsx');
const { TransactionFormFields } = require('../src/components/ModalAddInvoice/TransactionFormFields.tsx');
const { InstallmentOptions } = require('../src/components/ModalAddInvoice/InstallmentOptions.tsx');
const { MonthlyFixedOption } = require('../src/components/ModalAddInvoice/MonthlyFixedOption.tsx');
const expense = (id, date, value, description, extra = {}) => ({
  id, addDate: dayjs(date), addDateFormatted: dayjs(date).format('MM/YYYY'),
  invoiceCategory: 'Contas', userId: 'family', value, description, ...extra,
});
const fixed = expense('fixed', '2026-11-15', 500, 'Condomínio', { isMonthlyFixed: true });
const renderTimeline = expenses => renderToStaticMarkup(React.createElement(MonthlyExpensesTimeline, { expenses }));

test('fixed expenses have a separate monthly group and subtotal, while daily expenses stay in reverse date order', () => {
  const html = renderTimeline([
    expense('old', '2026-11-02', 40, 'Mais antiga'), fixed,
    expense('new', '2026-11-05', 30, 'Mais recente do dia'),
    expense('fixed2', '2026-11-25', 100, 'Internet', { isMonthlyFixed: true }),
  ]);
  const fixedSection = html.match(/<section\b[\s\S]*?<\/section>/)[0];
  assert.match(fixedSection, /Condomínio/);
  assert.match(fixedSection, /Internet/);
  assert.match(fixedSection, /600,00/);
  assert.doesNotMatch(fixedSection, /MuiTimelineItem|15 de novembro|25 de novembro/);
  const timeline = html.slice(html.indexOf('aria-label="Despesas do mês, da mais recente à mais antiga"'));
  assert.ok(timeline.indexOf('Mais recente do dia') < timeline.indexOf('Mais antiga'));
  assert.doesNotMatch(timeline, /Condomínio|Internet|600,00/);
  assert.equal((html.match(/>Condomínio</g) || []).length, 1);
  assert.equal((html.match(/aria-expanded="false"/g) || []).length, 3);
  assert.equal((html.match(/aria-expanded="true"/g) || []).length, 0);
});

test('a month containing only fixed expenses has no daily timeline or empty-state message', () => {
  const html = renderTimeline([fixed]);
  assert.match(html, /Despesas fixas do mês/);
  assert.doesNotMatch(html, /MuiTimelineItem|Nenhuma despesa/);
  assert.doesNotMatch(renderTimeline([{ ...fixed, isMonthlyFixed: false }]), /Despesas fixas do mês/);
  assert.match(renderTimeline([]), /Nenhuma despesa neste mês/);
});

test('installments are grouped automatically once per month and take precedence over the fixed marking', () => {
  const html = renderTimeline([
    fixed,
    expense('new-parcel', '2026-11-15', 80, 'Consulta editada', { installmentNumber: 2, installmentCount: 5, isMonthlyFixed: true }),
    expense('legacy-parcel', '2026-11-20', 20, 'Cafeteira · Parcela 1/3'),
    expense('daily', '2026-11-05', 30, 'Almoço'),
  ]);
  const sections = html.match(/<section\b[\s\S]*?<\/section>/g);
  assert.equal(sections.length, 2);
  const installmentSection = sections.find(section => section.includes('aria-labelledby="installment-expenses-heading"'));
  assert.match(installmentSection, /Despesas parceladas/);
  assert.match(installmentSection, /Consulta editada/);
  assert.match(installmentSection, /Cafeteira/);
  assert.match(installmentSection, /100,00/);
  assert.doesNotMatch(installmentSection, /MuiTimelineItem|15 de novembro|20 de novembro/);
  assert.doesNotMatch(sections[0], /Consulta editada|Cafeteira/);
  const timeline = html.slice(html.indexOf('aria-label="Despesas do mês, da mais recente à mais antiga"'));
  assert.match(timeline, /Almoço/);
  assert.doesNotMatch(timeline, /Consulta editada|Cafeteira|Condomínio/);
  assert.equal((html.match(/>Consulta editada</g) || []).length, 1);
});

test('a month containing only installments renders its monthly group without dated groups', () => {
  const entry = expense('installment-purchase-1', '2026-11-15', 100, 'Descrição editada', { isMonthlyFixed: true });
  const html = renderTimeline([entry]);
  assert.match(html, /Despesas parceladas/);
  assert.doesNotMatch(html, /Despesas fixas do mês|MuiTimelineItem|Nenhuma despesa/);
  assert.equal(entry.addDate.format('DD/MM/YYYY'), '15/11/2026');
  const table = renderToStaticMarkup(React.createElement(ExpensesTable, { invoices: [entry], onEdit() {}, onDelete() {} }));
  assert.match(table, /Parcelada/);
  assert.match(table, /11\/2026/);
  assert.doesNotMatch(table, /Fixa do mês|15\/11\/2026/);
});

test('the expense table shows the month instead of a specific date for fixed expenses', () => {
  const html = renderToStaticMarkup(React.createElement(ExpensesTable, { invoices: [fixed], onEdit() {}, onDelete() {} }));
  assert.match(html, /Fixa do mês/);
  assert.match(html, /11\/2026/);
  assert.doesNotMatch(html, /15\/11\/2026/);
});

test('expense forms keep daily entry compact and use a month picker only for marked expenses', () => {
  const renderFields = (values, allowMonthlyFixed) => renderToStaticMarkup(React.createElement(TransactionFormFields, {
    form: { values, setFieldValue() {}, handleChange() {} }, stackSpacing: 2,
    categoryOptions: [], categoryValue: '', onCategoryChange() {}, allowMonthlyFixed,
  }));
  const marked = renderFields(fixed, true);
  assert.doesNotMatch(marked, /Despesa fixa do mês/);
  assert.match(marked, /Mês de referência/);
  assert.match(marked, /value="11\/2026"/);
  const ordinary = renderFields({ ...fixed, isMonthlyFixed: false }, true);
  assert.match(ordinary, />Data</);
  assert.match(ordinary, /value="15\/11\/2026"/);
  const revenue = renderFields(fixed, false);
  assert.doesNotMatch(revenue, /Despesa fixa do mês|Mês de referência/);
  const options = renderToStaticMarkup(React.createElement(InstallmentOptions, {
    checked: false, count: '2', value: 500, disabled: false, onCheckedChange() {}, onCountChange() {},
  }, React.createElement(MonthlyFixedOption, { checked: true, disabled: false, onChange() {} })));
  assert.match(options, /Compra parcelada/);
  assert.match(options, /Despesa fixa do mês/);
  assert.equal((options.match(/type="checkbox"/g) || []).length, 2);
  assert.match(options, /type="checkbox"[^>]*checked/);
  assert.doesNotMatch(options, /Quantidade de parcelas|Pertence ao mês|condomínio/);
});
