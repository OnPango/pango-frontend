/**
 * Makes sure a session renewal runs at most once at a time, for the whole browser. It knows nothing
 * about HTTP, the store or the hint: it only decides *when* the renewal function may run.
 *
 * The refresh token lives in a cookie shared by every tab and rotates on use; presenting an old one
 * counts as theft (the backend then ends every session). So:
 * - in one tab, calls made while a renewal is in flight (several 401s at once, StrictMode double
 *   effects) share that renewal instead of starting another;
 * - across tabs, a Web Lock makes renewals take turns.
 */

const LOCK_NAME = 'pango-refresh-session';

let inFlight: Promise<boolean> | null = null;

async function withTabLock(task: () => Promise<boolean>): Promise<boolean> {
  if (typeof navigator === 'undefined' || !navigator.locks) return task();
  return await navigator.locks.request(LOCK_NAME, task);
}

/**
 * Runs `renew` unless one is already running in this tab, in which case it returns that one.
 * Resolves `true` when the session was renewed.
 */
export function coordinateRefresh(renew: () => Promise<boolean>): Promise<boolean> {
  inFlight ??= withTabLock(renew).finally(() => {
    inFlight = null;
  });
  return inFlight;
}
