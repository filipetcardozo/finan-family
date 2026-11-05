import { claimLaunch, finishLaunch } from './store';
import { commitLaunch, syncFailure } from './launches';

export async function syncPendingLaunches(uid: string, owner: string, isCurrentUser: () => boolean, isOnline: () => boolean) {
  while (isCurrentUser() && isOnline()) {
    const launch = await claimLaunch(uid, owner);
    if (!launch) return;
    try {
      await commitLaunch(launch, isCurrentUser);
      // Keep the operation until the server has acknowledged the entire transaction.
      await finishLaunch(launch.id, owner);
    } catch (error) {
      const failure = syncFailure(error, launch.attempts);
      await finishLaunch(launch.id, owner, failure);
      // Retry connectivity errors later; a refused item doesn't block other valid items.
      if (!failure.error || !isOnline() || !isCurrentUser()) return;
    }
  }
}
