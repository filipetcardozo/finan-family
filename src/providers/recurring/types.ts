import type { IInvoice } from '../invoices/types';
import type { IRevenue } from '../revenues/types';

export type TransactionKind = 'expense' | 'revenue';
export type FinancialTransaction = IInvoice | IRevenue;

export interface RecurringTemplate {
  id: string;
  kind: TransactionKind;
  category: string;
  description: string;
  value: number;
  day: number;
  startsOn: string;
  lastUsedMonth: string;
  active: boolean;
  matchValue?: boolean;
  valueAnchor?: number;
}

export interface RecurringCandidate {
  template: RecurringTemplate;
  saved: boolean;
  occurrences: number;
  suggested: boolean;
  alreadyPosted: boolean;
}

export interface RecurringSelection {
  template: RecurringTemplate;
  value: number;
  date: string;
}

export interface RecurringData {
  history: FinancialTransaction[];
  current: FinancialTransaction[];
  templates: RecurringTemplate[];
}

export interface RecurringReviewRow extends RecurringCandidate {
  selected: boolean;
  value: number | undefined;
  date: string;
}

