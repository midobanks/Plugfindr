import { ValidationError } from './errors';
import type { SpecialistId, VerificationId } from './ids';
import type { IntroductionState } from './introduction';
import type { VerificationState, VerificationType } from './verification';

export const DEFAULT_REQUIRED_VERIFICATIONS: readonly VerificationType[] = ['identity'];

export type SpecialistProfileStatus = 'pending' | 'approved' | 'suspended';

export type VerificationRecord = {
  readonly id: VerificationId;
  readonly specialistId: SpecialistId;
  readonly type: VerificationType;
  readonly status: VerificationState;
  readonly verifiedAt: Date | null;
  readonly expiresAt: Date | null;
};

export type Badge = {
  readonly type: VerificationType;
  readonly verifiedAt: Date;
  readonly expiresAt: Date | null;
};

export function isCurrentVerification(record: VerificationRecord, now: Date): boolean {
  return (
    record.status === 'approved' &&
    record.verifiedAt !== null &&
    (record.expiresAt === null || record.expiresAt.getTime() > now.getTime())
  );
}

export function deriveBadges(
  verifications: readonly VerificationRecord[],
  now: Date,
): readonly Badge[] {
  const badges: Badge[] = [];
  for (const record of verifications) {
    if (!isCurrentVerification(record, now) || record.verifiedAt === null) continue;
    badges.push({
      type: record.type,
      verifiedAt: record.verifiedAt,
      expiresAt: record.expiresAt,
    });
  }
  return badges;
}

export function isSpecialistDiscoverable(
  profileStatus: SpecialistProfileStatus,
  verifications: readonly VerificationRecord[],
  now: Date,
  requiredVerificationTypes: readonly VerificationType[] = DEFAULT_REQUIRED_VERIFICATIONS,
): boolean {
  if (profileStatus !== 'approved') return false;
  return requiredVerificationTypes.every((type) =>
    verifications.some((record) => record.type === type && isCurrentVerification(record, now)),
  );
}

export function canRevealContact(
  introductionStatus: IntroductionState,
  specialistSharedContact: boolean,
  engagementConfirmed: boolean,
): boolean {
  if (engagementConfirmed) return true;
  return introductionStatus === 'accepted' && specialistSharedContact;
}

export function validateMatchReasons(reasons: readonly string[]): readonly string[] {
  if (reasons.length < 2 || reasons.length > 3) {
    throw new ValidationError('A match needs 2 to 3 reasons');
  }
  for (const reason of reasons) {
    if (reason.trim().length === 0) {
      throw new ValidationError('Match reasons cannot be empty');
    }
  }
  return reasons;
}
