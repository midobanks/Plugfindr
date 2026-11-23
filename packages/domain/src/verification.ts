import type { StateChangedEvent } from './events';
import type { VerificationId } from './ids';
import { transition } from './state-machine';
import type { StateTransition } from './state-machine';

export const VERIFICATION_STATES = [
  'not_started',
  'submitted',
  'in_review',
  'approved',
  'rejected',
  'needs_more_info',
  'expired',
] as const;

export type VerificationState = (typeof VERIFICATION_STATES)[number];

export const VERIFICATION_TYPES = [
  'identity',
  'contact',
  'portfolio',
  'credentials',
  'reference',
  'skill',
  'proven',
  'business',
] as const;

export type VerificationType = (typeof VERIFICATION_TYPES)[number];

export const VERIFICATION_TRANSITIONS: Readonly<
  Record<VerificationState, readonly VerificationState[]>
> = {
  not_started: ['submitted'],
  submitted: ['in_review'],
  in_review: ['approved', 'rejected', 'needs_more_info'],
  needs_more_info: ['submitted', 'expired'],
  approved: ['expired'],
  rejected: [],
  expired: [],
};

export type VerificationStateChanged = StateChangedEvent<
  'VerificationStateChanged',
  VerificationState,
  VerificationId
>;

export function transitionVerification(
  current: VerificationState,
  next: VerificationState,
  verificationId: VerificationId,
  actorId: string,
  occurredAt: Date,
): StateTransition<VerificationState, VerificationStateChanged> {
  return transition(
    current,
    next,
    VERIFICATION_TRANSITIONS,
    'VerificationStateChanged',
    verificationId,
    actorId,
    occurredAt,
  );
}
