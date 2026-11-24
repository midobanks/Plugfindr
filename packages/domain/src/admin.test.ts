import { describe, expect, it } from 'vitest';
import {
  createAdminAuditEvent,
  hasRecentMfa,
  permissionsForRole,
  requireAdminAccess,
  requireAdminPermission,
} from './admin';
import { AuthenticationError, AuthorizationError, ValidationError } from './errors';
import { asId } from './ids';
import type { UserId } from './ids';
import type { Session, UserRole } from './identity';

const now = new Date('2027-03-12T00:00:00Z');

function makeSession(role: UserRole, mfaVerifiedAt: Date | null = now): Session {
  return {
    id: 'session-admin-001',
    actorId: asId<UserId>('user-admin-001'),
    role,
    createdAt: new Date('2027-03-11T00:00:00Z'),
    expiresAt: new Date('2027-03-13T00:00:00Z'),
    idleExpiresAt: new Date('2027-03-12T06:00:00Z'),
    method: 'email_password',
    mfaVerifiedAt,
  };
}

describe('admin permissions', () => {
  it('grants least privilege by internal role', () => {
    expect(permissionsForRole('reviewer')).toEqual(['verification.read', 'verification.review']);
    expect(permissionsForRole('support')).toContain('users.suspend');
    expect(permissionsForRole('support')).not.toContain('verification.review');
    expect(permissionsForRole('finance')).toEqual(['finance.read']);
    expect(permissionsForRole('business')).toEqual([]);
    expect(permissionsForRole('admin')).toContain('audit.read');
  });

  it('requires a fresh MFA check for sensitive admin roles', () => {
    expect(requireAdminAccess(makeSession('admin'), now).role).toBe('admin');
    expect(() => requireAdminAccess(makeSession('reviewer', null), now)).toThrow(
      AuthenticationError,
    );
    expect(() =>
      requireAdminAccess(makeSession('finance', new Date('2027-03-11T23:40:00Z')), now),
    ).toThrow(AuthenticationError);
    expect(() =>
      requireAdminAccess(makeSession('admin', new Date('2027-03-12T00:01:00Z')), now),
    ).toThrow(AuthenticationError);
    expect(hasRecentMfa(makeSession('matcher', null), now)).toBe(false);
  });

  it('rejects non-admin and insufficient permissions', () => {
    expect(() => requireAdminAccess(makeSession('specialist', null), now)).toThrow(
      AuthorizationError,
    );
    expect(() =>
      requireAdminPermission(makeSession('support'), 'verification.review', now),
    ).toThrow(AuthorizationError);
    expect(requireAdminPermission(makeSession('reviewer'), 'verification.review', now).role).toBe(
      'reviewer',
    );
  });
});

describe('admin audit events', () => {
  it('records only identifiers, actor role and action', () => {
    const event = createAdminAuditEvent({
      id: 'audit-fake-001',
      actorId: asId<UserId>('user-admin-001'),
      actorRole: 'admin',
      action: 'user.suspend',
      targetType: 'user',
      targetId: 'user-fake-002',
      occurredAt: now,
    });

    expect(event.action).toBe('user.suspend');
    expect(event.actorRole).toBe('admin');
    expect(JSON.stringify(event)).not.toContain('@');
  });

  it('rejects empty audit identifiers', () => {
    expect(() =>
      createAdminAuditEvent({
        id: 'audit-fake-002',
        actorId: asId<UserId>('user-admin-001'),
        actorRole: 'admin',
        action: 'verification.approve',
        targetType: 'verification',
        targetId: ' ',
        occurredAt: now,
      }),
    ).toThrow(ValidationError);
  });
});
