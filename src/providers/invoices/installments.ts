import dayjs from 'dayjs';
import { collection, doc, runTransaction } from 'firebase/firestore';
import { database } from '../../../firebaseConfig';
import { buildInstallmentInvoices } from '../../utils/installments';
import type { IInvoice } from './types';

export const createInstallmentPurchaseId = () => doc(collection(database, 'invoices')).id;

export const putInstallmentInvoices = async (invoice: IInvoice, count: number, purchaseId: string): Promise<IInvoice[]> => {
  if (!invoice.userId || !/^[a-zA-Z0-9_-]{1,120}$/.test(purchaseId)) {
    throw new Error('Entre na sua conta para lançar a compra parcelada.');
  }
  const installments = buildInstallmentInvoices(invoice, count).map((entry, index) => ({
    ...entry, id: `installment-${purchaseId}-${index + 1}`,
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
