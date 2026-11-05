import { useCallback, useEffect, useMemo, useState } from 'react';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import dayjs from 'dayjs';
import { database, offlineCacheReady } from '../../firebaseConfig';
import { useOfflineSync } from '../contexts/offlineSync';
import type { IInvoice } from '../providers/invoices/types';
import type { IRevenue } from '../providers/revenues/types';
import type { LaunchCollection } from '../providers/offline/types';
import { mergeMonthlyTransactions } from '../utils/offlineTransactions';

export function useMonthlyTransactions<T extends IInvoice | IRevenue>(name: LaunchCollection, uid: string, month: string, ready = true) {
  const { launches, loading: loadingQueue } = useOfflineSync();
  const key = `${uid}:${month}`;
  const [snapshot, setSnapshot] = useState({ key: '', entries: [] as T[], loading: true });

  useEffect(() => {
    let stopped = false;
    let unsubscribe: (() => void) | undefined;
    if (!ready) return;
    if (!uid) { setSnapshot({ key, entries: [], loading: false }); return; }
    setSnapshot({ key, entries: [], loading: true });
    void offlineCacheReady.then(() => {
      if (stopped) return;
      unsubscribe = onSnapshot(query(collection(database, name), where('userId', '==', uid), where('addDateFormatted', '==', month)), data => {
        if (!stopped) setSnapshot({ key, loading: false, entries: data.docs.map(entry => ({
          ...entry.data(), id: entry.id, addDate: dayjs(entry.data().addDate),
        } as T)) });
      }, () => {
        if (!stopped) setSnapshot(previous => ({ ...previous, loading: false }));
      });
    });
    return () => { stopped = true; unsubscribe?.(); };
  }, [name, uid, month, key, ready]);

  const updateEntries = useCallback((change: (previous: T[]) => T[]) => {
    setSnapshot(previous => ({ key, loading: false, entries: change(previous.key === key ? previous.entries : []) }));
  }, [key]);
  const entries = useMemo(() => mergeMonthlyTransactions(snapshot.key === key ? snapshot.entries : [], launches, name, uid, month),
    [snapshot, key, launches, name, uid, month]);
  return { entries, updateEntries, loading: !ready || loadingQueue || (snapshot.key !== key || snapshot.loading) };
}
