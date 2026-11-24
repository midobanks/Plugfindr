import type { EngagementId, EngagementState, Review, ReviewId } from '@plugfindr/domain';

export type EngagementForStore = {
  readonly id: EngagementId;
  readonly businessId: string;
  readonly specialistId: string;
  readonly state: EngagementState;
  readonly completedAt: Date | null;
};

export interface EngagementStore {
  get(id: EngagementId): Promise<EngagementForStore | null>;
  recordState(
    id: EngagementId,
    state: EngagementState,
    completedAt: Date | null,
    actorId: string,
    occurredAt: Date,
  ): Promise<EngagementForStore | null>;
  listForParty(actorId: string): Promise<readonly EngagementForStore[]>;
}

export interface ReviewStore {
  create(review: Review): Promise<Review>;
  listForSpecialist(specialistId: string): Promise<readonly Review[]>;
  listForEngagement(id: EngagementId): Promise<readonly Review[]>;
  get(id: ReviewId): Promise<Review | null>;
}
