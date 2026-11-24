import { describe, expect, it } from 'vitest';
import { AuthenticationError, AuthorizationError } from './errors';
import { asId } from './ids';
import type { UserId } from './ids';
import {
  canAccessAdmin,
  isSessionActive,
  requireActiveSession,
  requireRole,
  requiresMfa,
} from './identity';
import type { Session } from './identity';

const now = new Date('2027-03-12T00:00:00Z');

function makeSession(overrides: Partial<Session> = {}): Session {
  return {
    id: 'session-001',
    actorId: asId<UserId>('user-001'),
    role: 'business',
    createdAt: new Date('2027-03-11T00:00:00Z'),
    expiresAt: new Date('2027-03-13T00:00:00Z'),
    idleExpiresAt: new Date('2027-03-12T06:00:00Z'),
    method: 'phone_otp',
    ...overrides,
  };
}

describe('identity and session rules', () => {
  it('denies business users access to admin tools and grants internal roles', () => {
    expect(canAccessAdmin('business')).toBe(false);
    expect(canAccessAdmin('specialist')).toBe(false);
    expect(canAccessAdmin('reviewer')).toBe(true);
    expect(canAccessAdmin('admin')).toBe(true);
  });

  it('requires MFA for reviewer, trust and safety, admin and finance roles', () => {
    expect(requiresMfa('reviewer')).toBe(true);
    expect(requiresMfa('trust_safety')).toBe(true);
    expect(requiresMfa('admin')).toBe(true);
    expect(requiresMfa('finance')).toBe(true);
    expect(requiresMfa('matcher')).toBe(false);
    expect(requiresMfa('business')).toBe(false);
  });

  it('rejects expired absolute and idle sessions', () => {
    expect(isSessionActive(makeSession(), now)).toBe(true);
    expect(isSessionActive(makeSession({ expiresAt: new Date('2027-03-11T23:59:59Z') }), now)).toBe(
      false,
    );
    expect(
      isSessionActive(makeSession({ idleExpiresAt: new Date('2027-03-11T23:59:59Z') }), now),
    ).toBe(false);
  });

  it('throws a typed error for missing or inactive sessions', () => {
    expect(() => requireActiveSession(null, now)).toThrow(AuthenticationError);
    expect(() => requireActiveSession(makeSession({ expiresAt: new Date(0) }), now)).toThrow(
      AuthenticationError,
    );
  });

  it('checks roles only after the session is active', () => {
    const session = makeSession({ role: 'business' });
    expect(() => requireRole(session, ['admin'], now)).toThrow(AuthorizationError);
    expect(requireRole(makeSession({ role: 'admin' }), ['admin'], now)).toBeDefined();
  });
});
