import type { PendingLaunch } from './types';

const DATABASE_NAME = 'finan-family-offline';
const STORE_NAME = 'launches';
const EVENT_NAME = 'finan-family-offline-change';
let connection: Promise<IDBDatabase> | undefined;
let channel: BroadcastChannel | undefined;

const openDatabase = () => {
  if (!connection) {
    connection = new Promise<IDBDatabase>((resolve, reject) => {
      if (typeof indexedDB === 'undefined') {
        reject(new Error('O armazenamento local não está disponível neste navegador.'));
        return;
      }
      const request = indexedDB.open(DATABASE_NAME, 1);
      request.onupgradeneeded = () => {
        const store = request.result.createObjectStore(STORE_NAME, { keyPath: 'id' });
        store.createIndex('userId', 'userId');
      };
      request.onsuccess = () => {
        const database = request.result;
        database.onversionchange = () => { database.close(); connection = undefined; };
        resolve(database);
      };
      request.onerror = () => reject(request.error);
      request.onblocked = () => reject(new Error('Feche as outras abas do app e tente novamente.'));
    }).catch(error => { connection = undefined; throw error; });
  }
  return connection;
};

// Resolve only after the IndexedDB transaction commits, never just on request success.
const accessStore = async <T,>(mode: IDBTransactionMode, action: (store: IDBObjectStore, result: (value: T) => void) => void): Promise<T> => {
  const database = await openDatabase();
  return new Promise<T>((resolve, reject) => {
    const transaction = database.transaction(STORE_NAME, mode);
    let value: T;
    transaction.oncomplete = () => resolve(value);
    transaction.onabort = () => reject(transaction.error ?? new Error('Não foi possível salvar no dispositivo.'));
    transaction.onerror = () => { /* onabort reports the failed transaction. */ };
    try { action(transaction.objectStore(STORE_NAME), result => { value = result; }); }
    catch (error) { transaction.abort(); reject(error); }
  });
};

const getChannel = () => {
  try {
    if (!channel && typeof BroadcastChannel !== 'undefined') channel = new BroadcastChannel(EVENT_NAME);
  } catch { /* Polling/focus still recover changes when cross-tab messaging is unavailable. */ }
  return channel;
};

const announceChange = () => {
  window.dispatchEvent(new Event(EVENT_NAME));
  getChannel()?.postMessage('changed');
};

export const subscribeToLaunches = (listener: () => void) => {
  window.addEventListener(EVENT_NAME, listener);
  const broadcast = getChannel();
  broadcast?.addEventListener('message', listener);
  return () => {
    window.removeEventListener(EVENT_NAME, listener);
    broadcast?.removeEventListener('message', listener);
  };
};

export const listLaunches = (uid: string) => accessStore<PendingLaunch[]>('readonly', (store, result) => {
  const request = store.index('userId').getAll(uid);
  request.onsuccess = () => result((request.result as PendingLaunch[]).sort((a, b) => a.createdAt - b.createdAt));
});

export const saveLaunch = async (launch: PendingLaunch) => {
  const saved = await accessStore<PendingLaunch>('readwrite', (store, result) => {
    const request = store.get(launch.id);
    request.onsuccess = () => {
      // A repeated submission never replaces an already saved operation.
      if (request.result) {
        if (request.result.userId !== launch.userId) { store.transaction.abort(); return; }
        result(request.result);
      } else { store.add(launch); result(launch); }
    };
  });
  announceChange();
  return saved;
};

// Claiming and checking a lease share one transaction, including across browser tabs.
export const claimLaunch = (uid: string, owner: string, now = Date.now()) => accessStore<PendingLaunch | undefined>('readwrite', (store, result) => {
  const request = store.index('userId').getAll(uid);
  request.onsuccess = () => {
    const next = (request.result as PendingLaunch[]).sort((a, b) => a.createdAt - b.createdAt)
      .find(item => !item.error && item.nextAttemptAt <= now && (item.leaseUntil ?? 0) <= now);
    if (!next) { result(undefined); return; }
    const claimed = { ...next, leaseOwner: owner, leaseUntil: now + 120_000 };
    store.put(claimed);
    result(claimed);
  };
});

export const finishLaunch = async (id: string, owner: string, failure?: { error?: string; nextAttemptAt: number }) => {
  await accessStore<void>('readwrite', (store, result) => {
    const request = store.get(id);
    request.onsuccess = () => {
      const current = request.result as PendingLaunch | undefined;
      if (current?.leaseOwner === owner) {
        if (failure) {
          const { leaseOwner, leaseUntil, ...rest } = current;
          store.put({ ...rest, ...failure, attempts: current.attempts + 1 });
        } else store.delete(id);
      }
      result(undefined);
    };
  });
  announceChange();
};

export const retryLaunches = async (uid: string, includeErrors = true) => {
  await accessStore<void>('readwrite', (store, result) => {
    const request = store.index('userId').getAll(uid);
    request.onsuccess = () => {
      (request.result as PendingLaunch[]).forEach(({ error, ...item }) => {
        if (error && !includeErrors) return;
        // Do not steal an in-flight operation from another tab.
        store.put({ ...item, nextAttemptAt: 0 });
      });
      result(undefined);
    };
  });
  announceChange();
};
