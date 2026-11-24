import type { IntroductionStore, MatchStore, RateLimiter } from '@plugfindr/adapters';
import {
  asId,
  createIntroduction,
  RateLimitError,
  ServiceUnavailableError,
  ValidationError,
} from '@plugfindr/domain';
import type { BusinessId, Introduction, MatchId, UserId } from '@plugfindr/domain';

export type IntroductionReceipt = {
  readonly id: Introduction['id'];
  readonly state: Introduction['state'];
  readonly responseDueAt: string;
};

export async function submitIntroduction(input: {
  store: IntroductionStore | null;
  limiter: RateLimiter | null;
  matchStore: MatchStore | null;
  actorId: UserId;
  matchId: string;
  briefSummary: string;
  budgetSummary: string | null;
  timeline: string;
  now: Date;
}): Promise<IntroductionReceipt> {
  if (input.store === null || input.limiter === null || input.matchStore === null) {
    throw new ServiceUnavailableError();
  }

  const decision = await input.limiter.check({
    key: `introduction:${input.actorId}`,
    now: input.now,
  });
  if (!decision.allowed) {
    throw new RateLimitError(decision.retryAfterSeconds);
  }

  const match = await input.matchStore.getById(asId<MatchId>(input.matchId));
  if (match === null) {
    throw new ValidationError('Match not found');
  }

  const introduction = createIntroduction({
    match,
    businessId: asId<BusinessId>(input.actorId),
    briefSummary: input.briefSummary,
    budgetSummary: input.budgetSummary,
    timeline: input.timeline,
    hasConflict: false,
    isBlocked: false,
    now: input.now,
  });
  await input.store.create(introduction);

  return {
    id: introduction.id,
    state: introduction.state,
    responseDueAt: introduction.responseDueAt.toISOString(),
  };
}
