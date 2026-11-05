import { getAuth } from 'firebase/auth';
import { collection, doc, runTransaction } from 'firebase/firestore';
import dayjs from 'dayjs';
import { database, firebaseApp } from '../../../firebaseConfig';
import type { IInvoice } from '../invoices/types';
import type { IRevenue } from '../revenues/types';
import { saveLaunch } from './store';
import type { LaunchCollection, PendingLaunch, StoredTransaction } from './types';

export const createLaunchId = (name: LaunchCollection) => doc(collection(database, name)).id;

export const queueTransactions = async <T extends IInvoice | IRevenue>(name: LaunchCollection, entries: T[]): Promise<T[]> => {
  const uid = getAuth(firebaseApp).currentUser?.uid;
  if (!uid || !entries.length || entries.length > 500 || new Set(entries.map(entry => entry.id)).size !== entries.length || entries.some(entry => entry.userId !== uid
    || !entry.id || entry.id.includes('/') || !entry.addDate?.isValid()
    || !Number.isFinite(entry.value) || entry.value! <= 0
    || Math.abs(Math.round(entry.value! * 100) - entry.value! * 100) > 0.000001
    || entry.addDateFormatted !== entry.addDate.format('MM/YYYY')
    || !('invoiceCategory' in entry ? entry.invoiceCategory : entry.revenueCategory)?.trim())) {
    throw new Error('Revise os dados do lançamento e entre na sua conta.');
  }
  const documents = entries.map(({ pendingSync, ...entry }) => JSON.parse(JSON.stringify({
    ...entry, addDate: entry.addDate!.toString(),
  })) as StoredTransaction);
  let saved: PendingLaunch;
  try {
    saved = await saveLaunch({
      id: `${name}:${entries[0].id}`, userId: uid, collection: name, documents,
      createdAt: Date.now(), attempts: 0, nextAttemptAt: 0,
    });
  } catch {
    throw new Error('Não foi possível salvar no dispositivo. Verifique o espaço e as permissões do navegador.');
  }
  return saved.documents.map(entry => ({ ...entry, addDate: dayjs(entry.addDate), pendingSync: true } as T));
};

export const commitLaunch = async (launch: PendingLaunch, isCurrentUser: () => boolean) => {
  if (!isCurrentUser()) throw new Error('Conta desconectada.');
  const refs = launch.documents.map(entry => doc(database, launch.collection, entry.id));
  await runTransaction(database, async transaction => {
    if (!isCurrentUser()) throw new Error('Conta desconectada.');
    const snapshots = await Promise.all(refs.map(ref => transaction.get(ref)));
    if (snapshots.some(snapshot => snapshot.exists() && snapshot.data()!.userId !== launch.userId)) {
      throw Object.assign(new Error('Este lançamento pertence a outra conta.'), { code: 'permission-denied' });
    }
    // All documents in an operation are created atomically. If any already exists,
    // a previous attempt committed: preserve subsequent edits/deletions on retries.
    if (snapshots.some(snapshot => snapshot.exists())) return;
    if (!isCurrentUser()) throw new Error('Conta desconectada.');
    launch.documents.forEach((entry, index) => transaction.set(refs[index], entry));
  });
};

export const syncFailure = (error: unknown, attempts: number, now = Date.now()) => {
  const code = (error as { code?: string })?.code?.replace('firestore/', '');
  const permanent = ['permission-denied', 'invalid-argument', 'not-found', 'resource-exhausted'].includes(code ?? '');
  return {
    error: permanent ? (code === 'permission-denied' ? 'Sem permissão para enviar. Entre novamente na sua conta e tente de novo.'
      : 'O envio foi recusado. Os lançamentos continuam salvos neste dispositivo.') : undefined,
    nextAttemptAt: now + Math.min(60_000, 2_000 * 2 ** Math.min(attempts, 5)),
  };
};
