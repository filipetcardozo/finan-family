import dayjs, { Dayjs } from 'dayjs';
import type {
  FinancialTransaction, RecurringCandidate, RecurringSelection, RecurringTemplate, TransactionKind,
} from '../providers/recurring/types';

export const HISTORY_MONTHS = 6;
const VALUE_TOLERANCE = 0.2;
const REPEATED_EXPENSE_MINIMUM = 300;

export const normalizeRecurringText = (value: string) => value
  .normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim().replace(/\s+/g, ' ').toLowerCase();

export const transactionCategory = (entry: FinancialTransaction) =>
  'invoiceCategory' in entry ? entry.invoiceCategory : entry.revenueCategory;

export const recurringIdentity = (kind: TransactionKind, category: string, description: string, valueAnchor?: number) =>
  JSON.stringify([
    kind, normalizeRecurringText(category), normalizeRecurringText(description),
    ...(valueAnchor === undefined ? [] : [valueAnchor]),
  ]);

export const historyMonthKeys = (month: Dayjs) => Array.from(
  { length: HISTORY_MONTHS }, (_, index) => month.subtract(index + 1, 'month').format('MM/YYYY'),
);

export const dateForRecurringDay = (month: Dayjs, day: number) =>
  month.startOf('month').date(Math.min(Math.max(day, 1), month.daysInMonth())).format('YYYY-MM-DD');

const similarValue = (left: number, right: number) =>
  Math.abs(left - right) <= Math.max(Math.abs(left), Math.abs(right)) * VALUE_TOLERANCE;

const isLargeRestaurantExpense = (kind: TransactionKind, category: string, value: number) =>
  kind === 'expense' && /^restaurantes?$/.test(normalizeRecurringText(category))
  && value > REPEATED_EXPENSE_MINIMUM;

// Installments must not turn into an indefinite monthly expense.
export const isInstallment = (description: string) =>
  /\b\d+\s*(?:\/|de)\s*\d+\b|\bparcela\b/i.test(normalizeRecurringText(description));

export const matchesRecurringTemplate = (entry: FinancialTransaction, template: RecurringTemplate) => {
  if (entry.recurringTemplateId === template.id) return true;
  if (recurringIdentity(template.kind, transactionCategory(entry), entry.description || '')
    !== recurringIdentity(template.kind, template.category, template.description)) {
    return false;
  }
  if (template.matchValue) return similarValue(entry.value ?? 0, template.value);
  // Descriptions identify variable bills and salaries. Without one, be conservative.
  return Boolean(template.description.trim()) || (
    similarValue(entry.value ?? 0, template.value)
    && Boolean(entry.addDate && Math.abs(entry.addDate.date() - template.day) <= 3)
  );
};

export const buildRecurringCandidates = (
  kind: TransactionKind,
  month: Dayjs,
  history: FinancialTransaction[],
  templates: RecurringTemplate[],
  current: FinancialTransaction[],
): RecurringCandidate[] => {
  const allowedMonths = new Set(historyMonthKeys(month));
  const groups = new Map<string, FinancialTransaction[]>();
  history.forEach(entry => {
    if (!entry.addDate?.isValid() || !allowedMonths.has(entry.addDate.format('MM/YYYY'))
      || !Number.isFinite(entry.value) || (entry.value ?? 0) <= 0
      || !transactionCategory(entry)?.trim() || isInstallment(entry.description || '')) return;
    const key = recurringIdentity(kind, transactionCategory(entry), entry.description || '');
    groups.set(key, [...(groups.get(key) || []), entry]);
  });

  const saved = new Map(templates.filter(template => template.kind === kind).map(template => [template.id, template]));
  const candidates: RecurringCandidate[] = [];
  const addCandidate = (template: RecurringTemplate, isSaved: boolean, occurrences: number, suggested: boolean) => {
    if (!template.active || template.startsOn > month.format('YYYY-MM')) return;
    candidates.push({
      template, saved: isSaved, occurrences, suggested,
      alreadyPosted: current.some(entry => matchesRecurringTemplate(entry, template)),
    });
  };

  groups.forEach((entries, id) => {
    const sorted = [...entries].sort((a, b) => b.addDate!.valueOf() - a.addDate!.valueOf());
    const months = new Set(entries.map(entry => entry.addDate!.format('YYYY-MM')));
    const description = sorted[0].description || '';
    if (!description.trim()) {
      const category = transactionCategory(sorted[0]);
      const existing = Array.from(saved.values()).filter(template =>
        recurringIdentity(template.kind, template.category, template.description) === id,
      );
      // An empty description is normal. Separate amounts instead of requiring
      // every unnamed purchase in the category to be the same monthly item.
      let remaining = sorted.filter(entry => !existing.some(template =>
        entry.recurringTemplateId === template.id || similarValue(entry.value!, template.value),
      )).sort((a, b) => b.value! - a.value!);
      const clusters: FinancialTransaction[][] = [];
      while (remaining.length) {
        const reference = remaining[0].value!;
        clusters.push(remaining.filter(entry => similarValue(entry.value!, reference)));
        remaining = remaining.filter(entry => !similarValue(entry.value!, reference));
      }
      clusters.forEach(cluster => {
        const reference = cluster[0].value!;
        const latest = [...cluster].sort((a, b) => b.addDate!.valueOf() - a.addDate!.valueOf())[0];
        const occurrences = new Set(cluster.map(entry => entry.addDate!.format('YYYY-MM'))).size;
        const restaurantWithOtherPurchases = kind === 'expense'
          && /^restaurantes?$/.test(normalizeRecurringText(category)) && months.size < entries.length;
        const useBaseIdentity = clusters.length === 1 && existing.length === 0;
        addCandidate({
          id: useBaseIdentity ? id : recurringIdentity(kind, category, '', reference),
          kind, category, description: '', value: latest.value!, day: latest.addDate!.date(),
          startsOn: month.format('YYYY-MM'), lastUsedMonth: '', active: true, matchValue: true,
          ...(useBaseIdentity ? {} : { valueAnchor: reference }),
        }, false, occurrences, occurrences >= 2
          && (!restaurantWithOtherPurchases || reference > REPEATED_EXPENSE_MINIMUM));
      });
      return;
    }
    if (saved.has(id)) return;
    const values = entries.map(entry => entry.value!).sort((a, b) => a - b);
    const median = values[Math.floor(values.length / 2)];
    const unambiguous = months.size === entries.length;
    const standardSuggestion = months.size >= 2 && unambiguous && (
      Boolean(description.trim()) || entries.every(entry => similarValue(entry.value!, median))
    );
    // A recurring lunch budget can coexist with other restaurant purchases using
    // the same description. Recognize the repeated large amount on its own.
    const repeatedValue = kind === 'expense' && !standardSuggestion ? [...sorted].sort((a, b) => b.value! - a.value!).find(reference =>
      reference.value! > REPEATED_EXPENSE_MINIMUM && new Set(sorted.filter(entry =>
        entry.value! > REPEATED_EXPENSE_MINIMUM && similarValue(entry.value!, reference.value!),
      ).map(entry => entry.addDate!.format('YYYY-MM'))).size >= 2,
    ) : undefined;
    const matchingEntries = repeatedValue ? sorted.filter(entry =>
      entry.value! > REPEATED_EXPENSE_MINIMUM && similarValue(entry.value!, repeatedValue.value!),
    ) : sorted;
    const latest = matchingEntries[0];
    const occurrences = new Set(matchingEntries.map(entry => entry.addDate!.format('YYYY-MM'))).size;
    addCandidate({
      id, kind, category: transactionCategory(latest), description,
      value: latest.value!, day: latest.addDate!.date(),
      startsOn: month.format('YYYY-MM'), lastUsedMonth: '', active: true,
      ...(repeatedValue || isLargeRestaurantExpense(kind, transactionCategory(latest), latest.value!) ? { matchValue: true } : {}),
    }, false, occurrences, standardSuggestion || Boolean(repeatedValue));
  });

  saved.forEach(template => {
    const entries = groups.get(recurringIdentity(template.kind, template.category, template.description)) || [];
    const ambiguous = new Set(entries.map(entry => entry.addDate!.format('YYYY-MM'))).size < entries.length;
    const matchValue = !template.description.trim() || template.matchValue || isLargeRestaurantExpense(kind, template.category, template.value) || (
      kind === 'expense' && template.value > REPEATED_EXPENSE_MINIMUM && ambiguous
    );
    const matchingEntries = matchValue ? entries.filter(entry =>
      entry.recurringTemplateId === template.id || similarValue(entry.value!, template.value),
    ) : entries;
    const monthlyTemplate = matchValue ? { ...template, matchValue: true } : template;
    const latest = [...matchingEntries].sort((a, b) => b.addDate!.valueOf() - a.addDate!.valueOf())[0];
    // A later manual edit is a better default, but reviewing an old month must not
    // replace values saved for a newer one.
    const useLatest = latest && latest.addDate!.format('YYYY-MM') >= template.lastUsedMonth;
    const occurrences = new Set(matchingEntries.map(entry => entry.addDate!.format('YYYY-MM'))).size;
    if (!template.active) {
      // Keep stopped items available for an explicit choice in history, without
      // suggesting them again or selecting them by default.
      addCandidate({ ...monthlyTemplate, active: true, startsOn: month.format('YYYY-MM') }, false, occurrences, false);
      return;
    }
    const latestDay = latest && latest.addDate!.format('YYYY-MM-DD') === dateForRecurringDay(latest.addDate!, template.day)
      ? template.day : latest?.addDate!.date();
    addCandidate(useLatest ? {
      ...monthlyTemplate, value: latest.value!, day: latestDay!,
    } : monthlyTemplate, true, occurrences, true);
  });

  return candidates.sort((a, b) => b.template.value - a.template.value
    || a.template.category.localeCompare(b.template.category, 'pt-BR')
    || a.template.description.localeCompare(b.template.description, 'pt-BR'));
};

export const isValidRecurringSelection = (selection: RecurringSelection, month: Dayjs) => {
  const date = dayjs(selection.date);
  return Number.isFinite(selection.value) && selection.value > 0
    && Math.abs(Math.round(selection.value * 100) - selection.value * 100) < 0.000001
    && /^\d{4}-\d{2}-\d{2}$/.test(selection.date)
    && date.isValid() && date.format('YYYY-MM-DD') === selection.date
    && date.isSame(month, 'month');
};

export const updatedRecurringTemplates = (
  existing: RecurringTemplate[], selections: RecurringSelection[], month: Dayjs,
) => {
  const merged = new Map(existing.map(template => [template.id, template]));
  const monthKey = month.format('YYYY-MM');
  selections.forEach(({ template, value, date }) => {
    const previous = merged.get(template.id);
    merged.set(template.id, {
      ...template,
      value: previous && previous.lastUsedMonth > monthKey ? previous.value : value,
      day: previous && previous.lastUsedMonth > monthKey ? previous.day
        : date === dateForRecurringDay(month, template.day) ? template.day : dayjs(date).date(),
      startsOn: previous && previous.startsOn < monthKey ? previous.startsOn : monthKey,
      lastUsedMonth: previous && previous.lastUsedMonth > monthKey ? previous.lastUsedMonth : monthKey,
      active: true,
    });
  });
  return Array.from(merged.values());
};
