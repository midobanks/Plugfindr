import { FakeSessionStore } from '@plugfindr/adapters';
import { asId, AuthorizationError } from '@plugfindr/domain';
import type { UserId } from '@plugfindr/domain';
import { describe, expect, it } from 'vitest';
import { requireAdminSession, requireSession } from '../src/lib/auth/require-session';
import { readSessionIdFromCookieHeader } from '../src/lib/auth/session-cookie';
import { toApiError } from '../src/lib/http/api-error';

const now = new Date('2027-03-12T00:00:00Z');

function makeStore() {
  return new FakeSessionStore();
}

async function makeSession(store: FakeSessionStore, role: 'business' | 'admin' = 'business') {
  return store.create({
    actorId: asId<UserId>('user-fake-001'),
    role,
    method: 'phone_otp',
    createdAt: now,
    expiresAt: new Date('2027-03-13T00:00:00Z'),
    idleExpiresAt: new Date('2027-03-12T06:00:00Z'),
  });
}

describe('web auth scaffolding', () => {
  it('reads only the session cookie and tolerates malformed values', () => {
    expect(readSessionIdFromCookieHeader('other=1; pf_session=session-001')).toBe('session-001');
    expect(readSessionIdFromCookieHeader('pf_session=')).toBeNull();
    expect(readSessionIdFromCookieHeader('pf_session=%E0%A4%A')).toBeNull();
    expect(readSessionIdFromCookieHeader(undefined)).toBeNull();
  });

  it('requires a configured store and a valid session', async () => {
    const store = makeStore();
    const session = await makeSession(store);

    await expect(requireSession(store, `pf_session=${session.id}`, now)).resolves.toEqual(session);
    await expect(requireSession(null, `pf_session=${session.id}`, now)).rejects.toThrow(
      'Authentication is required',
    );
    await expect(requireSession(store, undefined, now)).rejects.toThrow(
      'Authentication is required',
    );
  });

  it('rejects non-admin sessions from admin-only helpers', async () => {
    const store = makeStore();
    const businessSession = await makeSession(store, 'business');
    const adminSession = await makeSession(store, 'admin');

    await expect(
      requireAdminSession(store, `pf_session=${businessSession.id}`, now),
    ).rejects.toThrow(AuthorizationError);
    await expect(requireAdminSession(store, `pf_session=${adminSession.id}`, now)).resolves.toEqual(
      adminSession,
    );
  });

  it('maps auth errors to safe user-facing responses', () => {
    const unauthenticated = toApiError(new Error('raw technical detail'), 'req-001');
    expect(unauthenticated.status).toBe(500);
    expect(unauthenticated.body.message).not.toContain('raw technical detail');
    expect(unauthenticated.body.requestId).toBe('req-001');

    const forbidden = toApiError(new AuthorizationError(), 'req-002');
    expect(forbidden.status).toBe(403);
    expect(forbidden.body.code).toBe('FORBIDDEN');
  });
});
