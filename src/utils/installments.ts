import type { IInvoice } from '../providers/invoices/types';

export const MAX_INSTALLMENTS = 500;

export const isValidInstallmentCount = (count: number) =>
  Number.isInteger(count) && count >= 2 && count <= MAX_INSTALLMENTS;

export const getInstallmentPurchaseId = (invoice: Pick<IInvoice, 'id' | 'installmentPurchaseId'>): string | null => {
  const fromId = invoice.id?.match(/^installment-([a-zA-Z0-9_-]{1,120})-([1-9]\d*)$/)?.[1];
  const stored = invoice.installmentPurchaseId;
  if (stored && (!/^[a-zA-Z0-9_-]{1,120}$/.test(stored) || (fromId && stored !== fromId))) return null;
  return stored || fromId || null;
};

export const getInstallmentPosition = (invoice: IInvoice) => {
  const legacy = (invoice.description ?? '').match(/(?:\bparcela\s+|^\s*)(\d+)\s*(?:\/|de)\s*(\d+)(?=\s|$|[·,;.)-])/i);
  const fromId = invoice.id?.match(/^installment-[a-zA-Z0-9_-]+-([1-9]\d*)$/)?.[1];
  const number = fromId ? Number(fromId) : invoice.installmentNumber ?? Number(legacy?.[1]);
  const count = invoice.installmentCount ?? (legacy ? Number(legacy[2]) : null);
  return { number, count };
};

export const getInstallmentBaseDescription = (description: string) => (description ?? '')
  .replace(/\s*(?:·\s*)?\bparcela\s+\d+\s*(?:\/|de)\s*\d+\s*$/i, '')
  .replace(/^\s*\d+\s*(?:\/|de)\s*\d+(?:\s+|$)/i, '')
  .trim();

export const formatInstallmentDescription = (description: string, number: number, count: number | null) => {
  const base = getInstallmentBaseDescription(description);
  if (!count || !Number.isInteger(number) || number < 1 || number > count) return base;
  const label = `Parcela ${number}/${count}`;
  return base ? `${base} · ${label}` : label;
};

export const buildInstallmentPurchaseUpdates = (original: IInvoice, edited: IInvoice, entries: IInvoice[]): IInvoice[] => {
  const purchaseId = getInstallmentPurchaseId(original);
  const originalPosition = getInstallmentPosition(original);
  if (!purchaseId || !original.userId || !entries.length || entries.length > MAX_INSTALLMENTS
    || !entries.some(entry => entry.id === original.id)
    || !Number.isInteger(originalPosition.number) || originalPosition.number < 1
    || !edited.addDate?.isValid() || !original.addDate?.isValid()
    || !Number.isFinite(edited.value) || (edited.value ?? 0) <= 0
    || Math.abs(Math.round(edited.value! * 100) - edited.value! * 100) > 0.000001
    || !edited.invoiceCategory.trim()) {
    throw new Error('Revise os dados da compra parcelada.');
  }
  const positions = entries.map(getInstallmentPosition);
  if (new Set(positions.map(position => position.number)).size !== entries.length
    || entries.some((entry, index) => entry.userId !== original.userId || getInstallmentPurchaseId(entry) !== purchaseId
      || !entry.addDate?.isValid()
      || !Number.isInteger(positions[index].number) || positions[index].number < 1 || positions[index].number > MAX_INSTALLMENTS)) {
    throw new Error('Não foi possível identificar as parcelas desta compra.');
  }
  const knownCounts = [originalPosition.count, ...positions.map(position => position.count)].filter((count): count is number => count !== null);
  if (knownCounts.some(count => !isValidInstallmentCount(count) || count < Math.max(...positions.map(position => position.number)))
    || new Set(knownCounts).size > 1) {
    throw new Error('A numeração das parcelas está inconsistente.');
  }
  const count = knownCounts[0] ?? null;
  const descriptionChanged = getInstallmentBaseDescription(edited.description) !== getInstallmentBaseDescription(original.description);
  const dateChanged = edited.addDate.format('YYYY-MM-DD') !== original.addDate.format('YYYY-MM-DD');
  return entries.map((entry, index) => {
    const number = positions[index].number;
    // Derive absolute dates from the edited installment so retrying never shifts the schedule twice.
    const month = edited.addDate!.startOf('month').add(number - originalPosition.number, 'month');
    const date = month.date(Math.min(edited.addDate!.date(), month.daysInMonth()));
    return {
      ...entry,
      installmentPurchaseId: purchaseId,
      installmentNumber: number,
      ...(count ? { installmentCount: count } : {}),
      ...(edited.value !== original.value ? { value: edited.value } : {}),
      ...(edited.invoiceCategory !== original.invoiceCategory ? { invoiceCategory: edited.invoiceCategory } : {}),
      ...(descriptionChanged ? { description: formatInstallmentDescription(edited.description, number, count) } : {}),
      ...(dateChanged ? { addDate: date, addDateFormatted: date.format('MM/YYYY') } : {}),
    };
  });
};

export const isInstallmentInvoice = (invoice: Pick<IInvoice, 'id' | 'description' | 'installmentNumber' | 'installmentCount'>) => {
  const validPosition = (number: number, count: number) =>
    Number.isInteger(number) && Number.isInteger(count) && count >= 2 && number >= 1 && number <= count;

  if (validPosition(invoice.installmentNumber ?? 0, invoice.installmentCount ?? 0)) return true;
  // Existing generated installments keep their identity even after description edits.
  if (/^installment-[a-zA-Z0-9_-]+-[1-9]\d*$/.test(invoice.id ?? '')) return true;

  // Recognize legacy installment labels without mistaking dates inside descriptions for installments.
  const position = (invoice.description ?? '').match(/(?:\bparcela\s+|^\s*)(\d+)\s*(?:\/|de)\s*(\d+)(?=\s|$|[·,;.)-])/i);
  return Boolean(position && validPosition(Number(position[1]), Number(position[2])));
};

export const buildInstallmentInvoices = (invoice: IInvoice, count: number): IInvoice[] => {
  if (!isValidInstallmentCount(count) || !invoice.addDate?.isValid()
    || !Number.isFinite(invoice.value) || (invoice.value ?? 0) <= 0
    || Math.abs(Math.round(invoice.value! * 100) - invoice.value! * 100) > 0.000001
    || !invoice.invoiceCategory.trim()) {
    throw new Error('Revise a categoria, o valor, a data e a quantidade de parcelas.');
  }

  const firstDate = invoice.addDate;
  const description = invoice.description.trim();
  return Array.from({ length: count }, (_, index) => {
    // Always add to the original date: Jan 31 -> Feb 28 -> Mar 31.
    const addDate = firstDate.add(index, 'month');
    const installmentLabel = `Parcela ${index + 1}/${count}`;
    return {
      id: '', userId: invoice.userId, invoiceCategory: invoice.invoiceCategory,
      value: invoice.value, addDate, addDateFormatted: addDate.format('MM/YYYY'),
      description: description ? `${description} · ${installmentLabel}` : installmentLabel,
      installmentNumber: index + 1,
      installmentCount: count,
      ...(invoice.isMonthlyFixed !== undefined ? { isMonthlyFixed: invoice.isMonthlyFixed } : {}),
    };
  });
};
