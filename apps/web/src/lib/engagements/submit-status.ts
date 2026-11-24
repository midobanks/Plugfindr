import type { EngagementStore, RateLimiter } from '@plugfindr/adapters';
import {
  asId,
  RateLimitError,
  ServiceUnavailableError,
  ValidationError,
  updateEngagementStatus,
} from '@plugfindr/domain';
import type {
  BusinessId,
  EngagementId,
  EngagementState,
  SpecialistId,
  UserId,
} from '@plugfindr/domain';

export type EngagementStatusReceipt = {
  readonly id: EngagementId;
  readonly state: EngagementState;
  readonly completedAt: string | null;
};

export async function submitEngagementStatus(input: {
  store: EngagementStore | null;
  limiter: RateLimiter | null;
  actorId: UserId;
  engagementId: string;
  state: EngagementState;
  now: Date;
}): Promise<EngagementStatusReceipt> {
  if (input.store === null || input.limiter === null) {
    throw new ServiceUnavailableError();
  }

  const decision = await input.limiter.check({
    key: `engagement-status:${input.actorId}`,
    now: input.now,
  });
  if (!decision.allowed) {
    throw new RateLimitError(decision.retryAfterSeconds);
  }

  const id = asId<EngagementId>(input.engagementId);
  const row = await input.store.get(id);
  if (row === null) {
    throw new ValidationError('Engagement not found');
  }

  const update = updateEngagementStatus(
    {
      id,
      businessId: asId<BusinessId>(row.businessId),
      specialistId: asId<SpecialistId>(row.specialistId),
      state: row.state,
    },
    input.state,
    input.actorId,
    input.now,
  );
  await input.store.recordState(
    id,
    update.transition.state,
    update.completedAt,
    input.actorId,
    input.now,
  );

  return {
    id,
    state: update.transition.state,
    completedAt: update.completedAt?.toISOString() ?? null,
  };
}
