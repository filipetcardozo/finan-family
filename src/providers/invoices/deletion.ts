import dayjs from 'dayjs';
import { collection, doc, getDocsFromServer, query, runTransaction, where } from 'firebase/firestore';
import { database } from '../../../firebaseConfig';
import type { IInvoice } from './types';
import { expenseMonthIndex, getExpenseSeries, isFutureSeriesExpense, isSameExpenseSeries } from '../../utils/expenseSeries';

export interface ExpenseDeletionOptions {
  includeFuture?: boolean;
  futureIds?: string[];
}

const deletionError = (message: string) => Object.assign(new Error(message), { code: 'expense-delete/review' });
const validate = (uid: string, reference: IInvoice) => {
  if (!uid || uid !== reference.userId || !reference.id || reference.pendingSync || !reference.addDate?.isValid() || expenseMonthIndex(reference) === null || !getExpenseSeries(reference)) {
    throw deletionError('Não foi possível identificar esta sequência de despesas.');
  }
  if (typeof navigator !== 'undefined' && navigator.onLine === false) throw deletionError('Conecte-se para excluir os lançamentos futuros.');
};

export async function getFutureSeriesExpenses(uid: string, reference: IInvoice): Promise<IInvoice[]> {
  validate(uid, reference);
  const series = getExpenseSeries(reference)!;
  const constraints = [where('userId', '==', uid)];
  if (series.kind === 'recurring') constraints.push(where('recurringTemplateId', '==', series.id));
  else if (reference.installmentPurchaseId) constraints.push(where('installmentPurchaseId', '==', series.id));
  // Legacy installments have only an ID prefix. Still match their explicit
  // purchase ID; descriptions/categories never define a deletion group.
  const snapshot = await getDocsFromServer(query(collection(database, 'invoices'), ...constraints));
  return snapshot.docs.map(entry => ({ ...entry.data(), id: entry.id, addDate: dayjs(entry.data().addDate) } as IInvoice))
    .filter(entry => isFutureSeriesExpense(reference, entry))
    .sort((left, right) => left.addDate!.valueOf() - right.addDate!.valueOf());
}

export async function deleteExpenseAndFuture(uid: string, reference: IInvoice, reviewedFutureIds: string[]): Promise<string[]> {
  validate(uid, reference);
  const series = getExpenseSeries(reference)!;
  const future = await getFutureSeriesExpenses(uid, reference);
  const reviewed = new Set(reviewedFutureIds);
  if (future.some(entry => !reviewed.has(entry.id))) {
    throw deletionError('Há novos lançamentos futuros. Confira a quantidade novamente.');
  }
  const ids = [reference.id, ...future.map(entry => entry.id)];
  if (ids.length + (series.kind === 'recurring' ? 1 : 0) > 500) {
    throw deletionError('Esta sequência excede o limite de exclusão em uma operação.');
  }
  const refs = ids.map(id => doc(database, 'invoices', id));
  const settingsRef = doc(database, 'userSettings', uid);
  return runTransaction(database, async transaction => {
    const snapshots = await Promise.all(refs.map(ref => transaction.get(ref)));
    const settings = series.kind === 'recurring' ? await transaction.get(settingsRef) : null;
    const current = snapshots[0];
    if (current.exists()) {
      const entry = { ...current.data(), id: reference.id, addDate: dayjs(current.data()!.addDate) } as IInvoice;
      if (!isSameExpenseSeries(reference, entry) || expenseMonthIndex(entry) !== expenseMonthIndex(reference)) {
        throw deletionError('Este lançamento mudou. Feche e abra a confirmação novamente.');
      }
    }
    const templates = settings?.data()?.recurringExpenseTemplates;
    if (series.kind === 'recurring' && (!Array.isArray(templates) || !templates.some(item => item.id === series.id))) {
      throw deletionError('A recorrência não está disponível. Você pode excluir apenas o lançamento atual.');
    }
    const deleted: string[] = [];
    snapshots.forEach((snapshot, index) => {
      if (!snapshot.exists()) return;
      const entry = { ...snapshot.data(), id: ids[index], addDate: dayjs(snapshot.data()!.addDate) } as IInvoice;
      if (index === 0 || isFutureSeriesExpense(reference, entry)) {
        // Ownership must be checked again against transactional, current data.
        if (entry.userId !== uid) throw deletionError('Não foi possível excluir esta despesa.');
        transaction.delete(refs[index]);
        deleted.push(ids[index]);
      }
    });
    if (series.kind === 'recurring') {
      transaction.set(settingsRef, {
        recurringExpenseTemplates: templates.map((item: { id: string }) => item.id === series.id ? { ...item, active: false } : item),
      }, { merge: true });
    }
    return deleted;
  });
}
