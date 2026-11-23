import { describe, expect, it } from 'vitest';
import { InvalidTransitionError } from './errors';
import { asId } from './ids';
import type { VerificationId } from './ids';
import { transitionVerification, VERIFICATION_STATES } from './verification';

const verificationId = asId<VerificationId>('ver-001');
const reviewerId = 'reviewer-001';
const now = new Date('2027-03-12T00:00:00Z');

describe('verification state machine', () => {
  it('walks submission through review to approval', () => {
    const submitted = transitionVerification(
      'not_started',
      'submitted',
      verificationId,
      reviewerId,
      now,
    );
    const reviewing = transitionVerification(
      submitted.state,
      'in_review',
      verificationId,
      reviewerId,
      now,
    );
    const approved = transitionVerification(
      reviewing.state,
      'approved',
      verificationId,
      reviewerId,
      now,
    );

    expect(approved.state).toBe('approved');
    expect(VERIFICATION_STATES).toHaveLength(7);
  });

  it('allows a reviewer to request more information and a resubmission', () => {
    const needsInfo = transitionVerification(
      'in_review',
      'needs_more_info',
      verificationId,
      reviewerId,
      now,
    );
    const resubmitted = transitionVerification(
      needsInfo.state,
      'submitted',
      verificationId,
      reviewerId,
      now,
    );
    expect(resubmitted.state).toBe('submitted');
  });

  it('expires an approved verification for re-verification', () => {
    const expired = transitionVerification('approved', 'expired', verificationId, 'system', now);
    expect(expired.state).toBe('expired');
  });

  it('rejects a direct jump from submitted to approved', () => {
    expect(() =>
      transitionVerification('submitted', 'approved', verificationId, reviewerId, now),
    ).toThrow(InvalidTransitionError);
  });

  it('rejects leaving rejected and expired states', () => {
    expect(() =>
      transitionVerification('rejected', 'submitted', verificationId, reviewerId, now),
    ).toThrow(InvalidTransitionError);
    expect(() =>
      transitionVerification('expired', 'in_review', verificationId, reviewerId, now),
    ).toThrow(InvalidTransitionError);
  });
});
