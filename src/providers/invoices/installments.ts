import dayjs from 'dayjs';
import { collection, doc, getDocs, query, runTransaction, where } from 'firebase/firestore';
import { database } from '../../../firebaseConfig';
import { buildInstallmentInvoices, buildInstallmentPurchaseUpdates, getInstallmentPurchaseId, getInstallmentPosition } from '../../utils/installments';
import type { IInvoice } from './types';
import { queueTransactions } from '../offline/launches';

export const createInstallmentPurchaseId = () => doc(collection(database, 'invoices')).id;

export const queueInstallmentInvoices = async (invoice: IInvoice, count: number, purchaseId: string): Promise<IInvoice[]> => {
  if (!/^[a-zA-Z0-9_-]{1,120}$/.test(purchaseId)) throw new Error('Não foi possível identificar a compra.');
  const entries = buildInstallmentInvoices(invoice, count).map((entry, index) => ({
    ...entry, installmentPurchaseId: purchaseId, id: `installment-${purchaseId}-${index + 1}`,
  }));
  return queueTransactions('invoices', entries);
};

export const putInstallmentInvoices = async (invoice: IInvoice, count: number, purchaseId: string): Promise<IInvoice[]> => {
  if (!invoice.userId || !/^[a-zA-Z0-9_-]{1,120}$/.test(purchaseId)) {
    throw new Error('Entre na sua conta para lançar a compra parcelada.');
  }
  const installments = buildInstallmentInvoices(invoice, count).map((entry, index) => ({
    ...entry, installmentPurchaseId: purchaseId, id: `installment-${purchaseId}-${index + 1}`,
  }));
  const refs = installments.map(entry => doc(database, 'invoices', entry.id));

  return runTransaction(database, async transaction => {
    const snapshots = await Promise.all(refs.map(ref => transaction.get(ref)));
    const existing = snapshots.filter(snapshot => snapshot.exists());
    // Retrying a submission must preserve independent edits/deletions and must
    // not create another set of installments after an uncertain response.
    if (existing.length) {
      if (existing.some(snapshot => snapshot.data()!.userId !== invoice.userId)) {
        throw new Error('Não foi possível confirmar a compra parcelada.');
      }
      return existing.map(snapshot => ({
        ...snapshot.data(), id: snapshot.id, addDate: dayjs(snapshot.data()!.addDate),
      } as IInvoice));
    }

    installments.forEach((entry, index) => transaction.set(refs[index], {
      ...entry, addDate: entry.addDate!.toString(),
    }));
    return installments;
  });
};

export const getInstallmentPurchaseInvoices = async (uid: string, invoice: IInvoice): Promise<IInvoice[]> => {
  const purchaseId = getInstallmentPurchaseId(invoice);
  if (!uid || uid !== invoice.userId || !purchaseId) throw new Error('Não foi possível identificar esta compra parcelada.');
  // Older purchases only have the common ID prefix; never infer a purchase from category or description.
  const constraints = [where('userId', '==', uid)];
  if (invoice.installmentPurchaseId) constraints.push(where('installmentPurchaseId', '==', purchaseId));
  const snapshot = await getDocs(query(collection(database, 'invoices'), ...constraints));
  const entries = snapshot.docs.map(entry => ({ ...entry.data(), id: entry.id, addDate: dayjs(entry.data().addDate) } as IInvoice))
    .filter(entry => entry.userId === uid && getInstallmentPurchaseId(entry) === purchaseId)
    .sort((left, right) => getInstallmentPosition(left).number - getInstallmentPosition(right).number);
  if (!entries.some(entry => entry.id === invoice.id)) throw new Error('Esta parcela não está mais disponível.');
  return entries;
};

export const updateInstallmentPurchase = async (uid: string, original: IInvoice, edited: IInvoice): Promise<IInvoice[]> => {
  const entries = await getInstallmentPurchaseInvoices(uid, original);
  const refs = entries.map(entry => doc(database, 'invoices', entry.id));
  return runTransaction(database, async transaction => {
    const snapshots = await Promise.all(refs.map(ref => transaction.get(ref)));
    const current = snapshots.filter(snapshot => snapshot.exists()).map(snapshot => ({
      ...snapshot.data(), id: snapshot.id, addDate: dayjs(snapshot.data()!.addDate),
    } as IInvoice));
    const updated = buildInstallmentPurchaseUpdates(original, edited, current);
    const refsById = new Map(refs.map(ref => [ref.id, ref]));
    updated.forEach(entry => transaction.set(refsById.get(entry.id)!, { ...entry, addDate: entry.addDate!.toString() }));
    return updated;
  });
};
