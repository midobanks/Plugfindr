import { AuthenticationError, AuthorizationError, ValidationError } from './errors';
import { canAccessAdmin, requireActiveSession, requiresMfa } from './identity';
import type { ADMIN_ROLES, Session, UserRole } from './identity';
import type { AuditEventId, UserId } from './ids';
import { asId } from './ids';

export const ADMIN_MFA_WINDOW_MINUTES = 15;

export const ADMIN_PERMISSIONS = [
  'users.read',
  'users.suspend',
  'users.reinstate',
  'users.impersonate',
  'verification.read',
  'verification.review',
  'matching.read',
  'matching.manage',
  'taxonomy.manage',
  'moderation.read',
  'moderation.manage',
  'reports.read',
  'audit.read',
  'finance.read',
] as const;

export type AdminPermission = (typeof ADMIN_PERMISSIONS)[number];
export type AdminRole = (typeof ADMIN_ROLES)[number];

const PERMISSIONS_BY_ROLE: Readonly<Record<AdminRole, readonly AdminPermission[]>> = {
  reviewer: ['verification.read', 'verification.review'],
  matcher: ['matching.read', 'matching.manage'],
  trust_safety: ['moderation.read', 'moderation.manage', 'reports.read'],
  support: ['users.read', 'users.suspend', 'users.reinstate', 'users.impersonate'],
  finance: ['finance.read'],
  admin: ADMIN_PERMISSIONS,
};

export type AdminAccess = {
  readonly session: Session;
  readonly role: AdminRole;
  readonly permissions: readonly AdminPermission[];
};

export function permissionsForRole(role: UserRole): readonly AdminPermission[] {
  if (!canAccessAdmin(role)) return [];
  return PERMISSIONS_BY_ROLE[role as AdminRole];
}

export function hasRecentMfa(session: Session, now: Date): boolean {
  const verifiedAt = session.mfaVerifiedAt;
  if (verifiedAt === undefined || verifiedAt === null) return false;
  const age = now.getTime() - verifiedAt.getTime();
  return age >= 0 && age <= ADMIN_MFA_WINDOW_MINUTES * 60 * 1000;
}

export function requireAdminAccess(session: Session | null, now: Date): AdminAccess {
  const active = requireActiveSession(session, now);
  if (!canAccessAdmin(active.role)) {
    throw new AuthorizationError();
  }
  if (requiresMfa(active.role) && !hasRecentMfa(active, now)) {
    throw new AuthenticationError();
  }
  return {
    session: active,
    role: active.role as AdminRole,
    permissions: permissionsForRole(active.role),
  };
}

export function requireAdminPermission(
  session: Session | null,
  permission: AdminPermission,
  now: Date,
): AdminAccess {
  const access = requireAdminAccess(session, now);
  if (!access.permissions.includes(permission)) {
    throw new AuthorizationError();
  }
  return access;
}

export type AdminAuditTargetType =
  | 'user'
  | 'verification'
  | 'request'
  | 'specialist'
  | 'match'
  | 'review'
  | 'report'
  | 'taxonomy'
  | 'payment';

export type AdminAuditAction =
  | 'user.suspend'
  | 'user.reinstate'
  | 'user.impersonate'
  | 'verification.approve'
  | 'verification.reject'
  | 'verification.request_info'
  | 'match.update'
  | 'taxonomy.update'
  | 'review.remove'
  | 'report.resolve'
  | 'payment.refund'
  | 'audit.export';

export type AdminAuditEvent = {
  readonly id: AuditEventId;
  readonly actorId: UserId;
  readonly actorRole: AdminRole;
  readonly action: AdminAuditAction;
  readonly targetType: AdminAuditTargetType;
  readonly targetId: string;
  readonly occurredAt: Date;
};

export type CreateAdminAuditEventInput = {
  readonly id: string;
  readonly actorId: UserId;
  readonly actorRole: AdminRole;
  readonly action: AdminAuditAction;
  readonly targetType: AdminAuditTargetType;
  readonly targetId: string;
  readonly occurredAt: Date;
};

function requireIdentifier(value: string, label: string): string {
  const trimmed = value.trim();
  if (trimmed.length < 1 || trimmed.length > 120) {
    throw new ValidationError(`${label} must be between 1 and 120 characters`);
  }
  return trimmed;
}

export function createAdminAuditEvent(input: CreateAdminAuditEventInput): AdminAuditEvent {
  return {
    id: asId<AuditEventId>(requireIdentifier(input.id, 'Audit event id')),
    actorId: input.actorId,
    actorRole: input.actorRole,
    action: input.action,
    targetType: input.targetType,
    targetId: requireIdentifier(input.targetId, 'Audit target id'),
    occurredAt: input.occurredAt,
  };
}
