export type LaunchCollection = 'invoices' | 'revenues';

export type StoredTransaction = {
  id: string;
  userId: string;
  addDate: string;
  addDateFormatted: string;
  [field: string]: unknown;
};

export type PendingLaunch = {
  id: string;
  userId: string;
  collection: LaunchCollection;
  documents: StoredTransaction[];
  createdAt: number;
  attempts: number;
  nextAttemptAt: number;
  error?: string;
  leaseOwner?: string;
  leaseUntil?: number;
};
