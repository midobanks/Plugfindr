import { AuthorizationError, ValidationError } from './errors';
import type { BusinessId, MatchFeedbackId, MatchId, RequestId, SpecialistId, UserId } from './ids';
import { asId } from './ids';
import type { Match } from './matching';

export type MatchFeedbackVerdict = 'relevant' | 'not_relevant';

export const MATCH_FEEDBACK_VERDICTS = ['relevant', 'not_relevant'] as const;

export type MatchFeedback = {
  readonly id: MatchFeedbackId;
  readonly matchId: MatchId;
  readonly requestId: RequestId;
  readonly specialistId: SpecialistId;
  readonly businessId: BusinessId;
  readonly verdict: MatchFeedbackVerdict;
  readonly reason: string | null;
  readonly createdAt: Date;
};

export type RecordMatchFeedbackInput = {
  readonly match: Match;
  readonly businessId: BusinessId;
  readonly actorId: UserId;
  readonly verdict: MatchFeedbackVerdict;
  readonly reason: string | null;
  readonly now: Date;
};

function requireReason(value: string): string {
  const trimmed = value.trim().replace(/\s+/gu, ' ');
  if (trimmed.length < 3 || trimmed.length > 500) {
    throw new ValidationError('Reason must be between 3 and 500 characters');
  }
  return trimmed;
}

export function recordMatchFeedback(input: RecordMatchFeedbackInput): MatchFeedback {
  if (String(input.actorId) !== String(input.businessId)) {
    throw new AuthorizationError();
  }
  if (
    input.verdict === 'not_relevant' &&
    (input.reason === null || input.reason.trim().length === 0)
  ) {
    throw new ValidationError('A reason is required when a match is not relevant');
  }

  return {
    id: asId<MatchFeedbackId>(`${input.match.matchId}:feedback:${input.actorId}`),
    matchId: input.match.matchId,
    requestId: input.match.requestId,
    specialistId: input.match.specialistId,
    businessId: input.businessId,
    verdict: input.verdict,
    reason: input.reason === null ? null : requireReason(input.reason),
    createdAt: input.now,
  };
}
