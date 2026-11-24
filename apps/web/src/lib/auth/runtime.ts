import type { SessionStore } from '@plugfindr/adapters';

const sessionStore: SessionStore | null = null;

export function getSessionStore(): SessionStore | null {
  return sessionStore;
}
