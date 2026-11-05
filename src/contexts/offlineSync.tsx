import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { getAuth } from 'firebase/auth';
import { firebaseApp } from '../../firebaseConfig';
import { useAuth } from '../hooks/useAuth';
import { listLaunches, retryLaunches, subscribeToLaunches } from '../providers/offline/store';
import { syncPendingLaunches } from '../providers/offline/sync';
import type { PendingLaunch } from '../providers/offline/types';
import { createClientId } from '../utils/clientId';

const OfflineSyncContext = createContext({
  launches: [] as PendingLaunch[], online: true, syncing: false, loading: true, storageError: '',
  retry: async () => {},
});

export const useOfflineSync = () => useContext(OfflineSyncContext);

export function OfflineSyncProvider({ children }: { children: React.ReactNode }) {
  const { uid } = useAuth();
  const [state, setState] = useState({ uid: '', launches: [] as PendingLaunch[], loading: true, storageError: '' });
  const [online, setOnline] = useState(true);
  const [syncingUser, setSyncingUser] = useState('');

  useEffect(() => {
    if (!uid) {
      setState({ uid: '', launches: [], loading: false, storageError: '' });
      return;
    }
    let stopped = false;
    let running = false;
    let revision = 0;
    const owner = createClientId();
    const isCurrentUser = () => !stopped && getAuth(firebaseApp).currentUser?.uid === uid;

    const refresh = async () => {
      const version = ++revision;
      try {
        const launches = await listLaunches(uid);
        if (!stopped && version === revision) setState({ uid, launches, loading: false, storageError: '' });
      } catch {
        if (!stopped && version === revision) setState(previous => ({
          uid, launches: previous.uid === uid ? previous.launches : [], loading: false,
          storageError: 'Armazenamento local indisponível. Não é possível salvar novos lançamentos neste dispositivo.',
        }));
      }
    };

    const drain = async () => {
      if (running || !isCurrentUser() || !navigator.onLine) return;
      running = true;
      setSyncingUser(uid);
      try {
        await syncPendingLaunches(uid, owner, isCurrentUser, () => navigator.onLine);
      } catch {
        await refresh();
      } finally {
        running = false;
        if (!stopped) { setSyncingUser(''); await refresh(); }
      }
    };

    const changed = () => { void refresh(); void drain(); };
    const connected = () => {
      setOnline(navigator.onLine);
      // Reconnecting/focusing also resets transient retry delays.
      if (navigator.onLine) void retryLaunches(uid, false).then(changed).catch(() => refresh());
      else changed();
    };
    const visible = () => { if (document.visibilityState === 'visible') connected(); };
    const unsubscribe = subscribeToLaunches(changed);
    window.addEventListener('online', connected);
    window.addEventListener('offline', connected);
    window.addEventListener('focus', connected);
    document.addEventListener('visibilitychange', visible);
    const interval = window.setInterval(changed, 15_000);
    setOnline(navigator.onLine);
    changed();
    return () => {
      stopped = true;
      unsubscribe();
      window.clearInterval(interval);
      window.removeEventListener('online', connected);
      window.removeEventListener('offline', connected);
      window.removeEventListener('focus', connected);
      document.removeEventListener('visibilitychange', visible);
    };
  }, [uid]);

  const retry = useCallback(async () => { if (uid) await retryLaunches(uid); }, [uid]);
  const value = useMemo(() => ({
    launches: state.uid === uid ? state.launches : [], online,
    loading: Boolean(uid) && (state.uid !== uid || state.loading),
    storageError: state.uid === uid ? state.storageError : '',
    syncing: syncingUser === uid && Boolean(uid), retry,
  }), [state, uid, online, syncingUser, retry]);
  return <OfflineSyncContext.Provider value={value}>{children}</OfflineSyncContext.Provider>;
}
