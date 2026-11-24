import type { EngagementStore, RateLimiter, ReviewStore } from '@plugfindr/adapters';
import {
  asId,
  RateLimitError,
  ServiceUnavailableError,
  submitReview,
  ValidationError,
} from '@plugfindr/domain';
import type {
  BusinessId,
  EngagementId,
  Review,
  ReviewRatings,
  SpecialistId,
  UserId,
} from '@plugfindr/domain';

export type ReviewReceipt = {
  readonly id: Review['id'];
  readonly createdAt: string;
};

export async function submitReviewForEngagement(input: {
  store: ReviewStore | null;
  engagementStore: EngagementStore | null;
  limiter: RateLimiter | null;
  actorId: UserId;
  engagementId: string;
  ratings: ReviewRatings;
  comment: string;
  privateFeedback: string | null;
  now: Date;
}): Promise<ReviewReceipt> {
  if (input.store === null || input.engagementStore === null || input.limiter === null) {
    throw new ServiceUnavailableError();
  }

  const decision = await input.limiter.check({
    key: `review:${input.actorId}`,
    now: input.now,
  });
  if (!decision.allowed) {
    throw new RateLimitError(decision.retryAfterSeconds);
  }

  const id = asId<EngagementId>(input.engagementId);
  const row = await input.engagementStore.get(id);
  if (row === null) {
    throw new ValidationError('Engagement not found');
  }

  const review = submitReview({
    engagement: {
      id,
      businessId: asId<BusinessId>(row.businessId),
      specialistId: asId<SpecialistId>(row.specialistId),
      state: row.state,
      completedAt: row.completedAt,
    },
    authorId: input.actorId,
    ratings: input.ratings,
    comment: input.comment,
    privateFeedback: input.privateFeedback,
    existingReviews: await input.store.listForEngagement(id),
    now: input.now,
  });
  await input.store.create(review);

  return { id: review.id, createdAt: review.createdAt.toISOString() };
}
