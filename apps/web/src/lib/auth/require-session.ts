import type { SessionStore } from '@plugfindr/adapters';
import { AuthenticationError, requireAdminAccess } from '@plugfindr/domain';
import type { Session } from '@plugfindr/domain';
import { readSessionIdFromCookieHeader } from './session-cookie';

export async function requireSession(
  store: SessionStore | null,
  cookieHeader: string | undefined,
  now: Date = new Date(),
): Promise<Session> {
  const sessionId = readSessionIdFromCookieHeader(cookieHeader);
  if (sessionId === null || store === null) {
    throw new AuthenticationError();
  }
  const session = await store.get(sessionId, now);
  if (session === null) {
    throw new AuthenticationError();
  }
  return session;
}

export async function requireAdminSession(
  store: SessionStore | null,
  cookieHeader: string | undefined,
  now: Date = new Date(),
): Promise<Session> {
  const session = await requireSession(store, cookieHeader, now);
  return requireAdminAccess(session, now).session;
}
