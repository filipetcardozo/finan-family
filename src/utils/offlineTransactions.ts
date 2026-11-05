import dayjs from 'dayjs';
import type { IInvoice } from '../providers/invoices/types';
import type { IRevenue } from '../providers/revenues/types';
import type { LaunchCollection, PendingLaunch } from '../providers/offline/types';

export function mergeMonthlyTransactions<T extends IInvoice | IRevenue>(server: T[], launches: PendingLaunch[], name: LaunchCollection, uid: string, month: string): T[] {
  const merged = new Map(server.filter(entry => entry.userId === uid && entry.addDateFormatted === month).map(entry => [entry.id, entry]));
  launches.filter(launch => launch.userId === uid && launch.collection === name).forEach(launch => {
    launch.documents.filter(entry => entry.userId === uid && entry.addDateFormatted === month).forEach(entry => {
      merged.set(entry.id, { ...entry, addDate: dayjs(entry.addDate), pendingSync: true } as T);
    });
  });
  return Array.from(merged.values());
}
