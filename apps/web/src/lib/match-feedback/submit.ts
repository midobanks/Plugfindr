import type { MatchFeedbackStore, MatchStore, RateLimiter } from '@plugfindr/adapters';
import {
  asId,
  RateLimitError,
  recordMatchFeedback,
  ServiceUnavailableError,
  ValidationError,
} from '@plugfindr/domain';
import type { MatchFeedbackId, MatchFeedbackVerdict, MatchId, UserId } from '@plugfindr/domain';

export type MatchFeedbackReceipt = {
  readonly id: MatchFeedbackId;
  readonly verdict: MatchFeedbackVerdict;
};

export async function submitMatchFeedback(input: {
  matchStore: MatchStore | null;
  feedbackStore: MatchFeedbackStore | null;
  limiter: RateLimiter | null;
  actorId: UserId;
  matchId: string;
  verdict: MatchFeedbackVerdict;
  reason: string | null;
  now: Date;
}): Promise<MatchFeedbackReceipt> {
  if (input.matchStore === null || input.feedbackStore === null || input.limiter === null) {
    throw new ServiceUnavailableError();
  }

  const decision = await input.limiter.check({
    key: `match-feedback:${input.actorId}`,
    now: input.now,
  });
  if (!decision.allowed) {
    throw new RateLimitError(decision.retryAfterSeconds);
  }

  const id = asId<MatchId>(input.matchId);
  const match = await input.matchStore.getById(id);
  if (match === null) {
    throw new ValidationError('Match not found');
  }
  const ownerId = await input.matchStore.getOwner(id);
  if (ownerId === null) {
    throw new ValidationError('Match owner is unavailable');
  }

  const feedback = recordMatchFeedback({
    match,
    businessId: ownerId,
    actorId: input.actorId,
    verdict: input.verdict,
    reason: input.reason,
    now: input.now,
  });
  await input.feedbackStore.create(feedback);

  return { id: feedback.id, verdict: feedback.verdict };
}
