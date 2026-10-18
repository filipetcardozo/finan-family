import dayjs, { Dayjs } from 'dayjs';
import { collection, doc, getDoc, getDocs, query, runTransaction, where } from 'firebase/firestore';
import { database } from '../../../firebaseConfig';
import {
  historyMonthKeys, isValidRecurringSelection, matchesRecurringTemplate,
  recurringIdentity, updatedRecurringTemplates,
} from '../../utils/recurringTransactions';
import type {
  FinancialTransaction, RecurringData, RecurringSelection, RecurringTemplate, TransactionKind,
} from './types';

const collectionName = (kind: TransactionKind) => kind === 'expense' ? 'invoices' : 'revenues';
const settingsField = (kind: TransactionKind) => kind === 'expense'
  ? 'recurringExpenseTemplates' : 'recurringRevenueTemplates';

const readTemplates = (data: Record<string, unknown> | undefined, kind: TransactionKind): RecurringTemplate[] => {
  const value = data?.[settingsField(kind)];
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is RecurringTemplate => Boolean(item)
    && item.kind === kind && typeof item.category === 'string' && typeof item.description === 'string'
    && (item.valueAnchor === undefined || (Number.isFinite(item.valueAnchor) && item.valueAnchor > 0))
    && item.id === recurringIdentity(kind, item.category, item.description, item.valueAnchor)
    && Number.isFinite(item.value) && item.value > 0
    && Number.isInteger(item.day) && item.day >= 1 && item.day <= 31
    && typeof item.startsOn === 'string' && typeof item.lastUsedMonth === 'string'
    && (item.matchValue === undefined || typeof item.matchValue === 'boolean')
    && typeof item.active === 'boolean');
};

const getTransactions = async (uid: string, kind: TransactionKind, months: string[]) => {
  const snapshot = await getDocs(query(
    collection(database, collectionName(kind)),
    where('userId', '==', uid), where('addDateFormatted', 'in', months),
  ));
  return snapshot.docs.map(entry => ({
    ...entry.data(), id: entry.id, addDate: dayjs(entry.data().addDate),
  } as FinancialTransaction));
};

export const loadRecurringData = async (uid: string, kind: TransactionKind, month: Dayjs): Promise<RecurringData> => {
  if (!uid) throw new Error('Entre na sua conta para repetir lançamentos.');
  const monthKey = month.format('MM/YYYY');
  const [transactions, settings] = await Promise.all([
    getTransactions(uid, kind, [...historyMonthKeys(month), monthKey]),
    getDoc(doc(database, 'userSettings', uid)),
  ]);
  return {
    history: transactions.filter(entry => entry.addDateFormatted !== monthKey),
    current: transactions.filter(entry => entry.addDateFormatted === monthKey),
    templates: readTemplates(settings.data(), kind),
  };
};

// The same monthly item always addresses the same document, even across devices,
// retries and changes to its amount or day. Hashing also bounds the document ID.
const monthlyDocumentId = async (uid: string, templateId: string, month: Dayjs) => {
  const digest = await crypto.subtle.digest(
    'SHA-256', new TextEncoder().encode(JSON.stringify([uid, templateId, month.format('YYYY-MM')])),
  );
  return `recurring-${Array.from(new Uint8Array(digest)).map(byte => byte.toString(16).padStart(2, '0')).join('')}`;
};

export const launchRecurringTransactions = async (
  uid: string, kind: TransactionKind, month: Dayjs, selections: RecurringSelection[],
) => {
  if (!uid || !selections.length || selections.length > 400
    || new Set(selections.map(selection => selection.template.id)).size !== selections.length
    || selections.some(selection => selection.template.kind !== kind
      || (selection.template.valueAnchor !== undefined
        && (!Number.isFinite(selection.template.valueAnchor) || selection.template.valueAnchor <= 0))
      || selection.template.id !== recurringIdentity(kind, selection.template.category, selection.template.description, selection.template.valueAnchor)
      || !isValidRecurringSelection(selection, month))) {
    throw new Error('Revise os valores e as datas antes de lançar.');
  }

  // Also recognize transactions entered manually before opening/confirming review.
  const [current, ids] = await Promise.all([
    getTransactions(uid, kind, [month.format('MM/YYYY')]),
    Promise.all(selections.map(selection => monthlyDocumentId(uid, selection.template.id, month))),
  ]);
  const settingsRef = doc(database, 'userSettings', uid);
  const refs = ids.map(id => doc(database, collectionName(kind), id));

  return runTransaction(database, async transaction => {
    const settings = await transaction.get(settingsRef);
    // All reads must precede writes for Firestore transactions.
    const snapshots = await Promise.all(refs.map(ref => transaction.get(ref)));
    const transactions: FinancialTransaction[] = [];
    let createdCount = 0;

    selections.forEach((selection, index) => {
      const snapshot = snapshots[index];
      const existing = current.find(entry => matchesRecurringTemplate(entry, selection.template));
      if (snapshot.exists()) {
        transactions.push({ ...snapshot.data(), id: snapshot.id, addDate: dayjs(snapshot.data().addDate) } as FinancialTransaction);
      } else if (existing) {
        transactions.push(existing);
      } else {
        const entry = {
          id: ids[index], userId: uid, value: selection.value,
          description: selection.template.description,
          [kind === 'expense' ? 'invoiceCategory' : 'revenueCategory']: selection.template.category,
          addDate: dayjs(selection.date).toString(), addDateFormatted: month.format('MM/YYYY'),
          recurringTemplateId: selection.template.id,
        };
        transaction.set(refs[index], entry);
        transactions.push({ ...entry, addDate: dayjs(selection.date) } as FinancialTransaction);
        createdCount += 1;
      }
    });

    const confirmedSelections = selections.map((selection, index) => ({
      ...selection,
      value: transactions[index].value!,
      date: transactions[index].addDate!.format('YYYY-MM-DD'),
    }));
    transaction.set(settingsRef, {
      [settingsField(kind)]: updatedRecurringTemplates(readTemplates(settings.data(), kind), confirmedSelections, month),
    }, { merge: true });

    return { transactions, createdCount, skippedCount: selections.length - createdCount };
  });
};

export const stopRecurringTemplate = async (uid: string, template: RecurringTemplate) => {
  if (!uid) throw new Error('Entre na sua conta para alterar a lista mensal.');
  const ref = doc(database, 'userSettings', uid);
  await runTransaction(database, async transaction => {
    const settings = await transaction.get(ref);
    const templates = readTemplates(settings.data(), template.kind);
    transaction.set(ref, {
      [settingsField(template.kind)]: templates.map(item => item.id === template.id ? { ...item, active: false } : item),
    }, { merge: true });
  });
};
