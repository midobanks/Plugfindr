import type { UserId } from './ids';
import { AuthenticationError, AuthorizationError } from './errors';

export type UserRole =
  | 'business'
  | 'specialist'
  | 'reviewer'
  | 'matcher'
  | 'trust_safety'
  | 'support'
  | 'admin'
  | 'finance';

export type AuthMethod = 'email_password' | 'google' | 'phone_otp' | 'email_otp';

export type Session = {
  readonly id: string;
  readonly actorId: UserId;
  readonly role: UserRole;
  readonly createdAt: Date;
  readonly expiresAt: Date;
  readonly idleExpiresAt: Date;
  readonly method: AuthMethod;
  readonly mfaVerifiedAt?: Date | null;
};

export const ADMIN_ROLES = [
  'reviewer',
  'matcher',
  'trust_safety',
  'support',
  'admin',
  'finance',
] as const;

export const MFA_ROLES = ['reviewer', 'trust_safety', 'admin', 'finance'] as const;

export function hasRequiredRole(role: UserRole, required: readonly UserRole[]): boolean {
  return required.includes(role);
}

export function canAccessAdmin(role: UserRole): boolean {
  return hasRequiredRole(role, ADMIN_ROLES);
}

export function requiresMfa(role: UserRole): boolean {
  return hasRequiredRole(role, MFA_ROLES);
}

export function isSessionActive(session: Session, now: Date): boolean {
  return now < session.expiresAt && now < session.idleExpiresAt;
}

export function requireActiveSession(session: Session | null, now: Date): Session {
  if (session === null || !isSessionActive(session, now)) {
    throw new AuthenticationError();
  }
  return session;
}

export function requireRole(
  session: Session | null,
  required: readonly UserRole[],
  now: Date,
): Session {
  const active = requireActiveSession(session, now);
  if (!hasRequiredRole(active.role, required)) {
    throw new AuthorizationError();
  }
  return active;
}
