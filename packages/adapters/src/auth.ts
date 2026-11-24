import type { AuthMethod, Session, UserId, UserRole } from '@plugfindr/domain';

export type OtpChannel = 'email' | 'phone';
export type OtpPurpose = 'sign_in' | 'verify_contact';

export type OtpRequest = {
  readonly destination: string;
  readonly channel: OtpChannel;
  readonly purpose: OtpPurpose;
  readonly requestedAt: Date;
};

export type OtpChallenge = {
  readonly id: string;
  readonly channel: OtpChannel;
  readonly purpose: OtpPurpose;
  readonly expiresAt: Date;
  readonly attemptsRemaining: number;
};

export type OtpVerificationResult = {
  readonly destination: string;
  readonly channel: OtpChannel;
  readonly purpose: OtpPurpose;
};

export interface OtpProvider {
  requestCode(input: OtpRequest): Promise<OtpChallenge>;
  verifyCode(input: {
    challengeId: string;
    code: string;
    attemptedAt: Date;
  }): Promise<OtpVerificationResult | null>;
}

export type GoogleIdentity = {
  readonly subject: string;
  readonly email: string | null;
  readonly emailVerified: boolean;
};

export interface GoogleTokenVerifier {
  verifyIdToken(input: {
    idToken: string;
    audience: string;
    now: Date;
  }): Promise<GoogleIdentity | null>;
}

export interface EmailPasswordVerifier {
  verify(input: { email: string; password: string }): Promise<{
    actorId: UserId;
    role: UserRole;
  } | null>;
}

export interface SessionStore {
  create(input: {
    actorId: UserId;
    role: UserRole;
    method: AuthMethod;
    createdAt: Date;
    expiresAt: Date;
    idleExpiresAt: Date;
    mfaVerifiedAt?: Date | null;
  }): Promise<Session>;
  get(sessionId: string, now: Date): Promise<Session | null>;
  touch(sessionId: string, now: Date, idleExpiresAt: Date): Promise<Session | null>;
  revoke(sessionId: string): Promise<void>;
}

export interface RateLimiter {
  check(input: { key: string; now: Date }): Promise<{
    allowed: boolean;
    retryAfterSeconds: number;
  }>;
}
