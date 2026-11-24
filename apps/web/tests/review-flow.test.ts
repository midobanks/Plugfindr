import { FakeEngagementStore, FakeRateLimiter, FakeReviewStore } from '@plugfindr/adapters';
import { asId, ServiceUnavailableError, toPublicReview } from '@plugfindr/domain';
import type { EngagementId, ReviewRatings, UserId } from '@plugfindr/domain';
import { describe, expect, it } from 'vitest';
import { submitReviewForEngagement } from '../src/lib/reviews/submit';

const now = new Date('2027-03-12T00:00:00Z');
const engagementId = asId<EngagementId>('engagement-fake-001');

const ratings: ReviewRatings = {
  quality: 5,
  communication: 4,
  reliability: 5,
  value: 4,
};

const base = {
  actorId: asId<UserId>('business-fake-001'),
  engagementId: 'engagement-fake-001',
  ratings,
  comment: 'Clear communication and the work was delivered on time.',
  privateFeedback: 'Private note for Plugfindr',
  now,
};

describe('review submission', () => {
  it('returns 503 scaffolding until stores are connected', async () => {
    await expect(
      submitReviewForEngagement({
        ...base,
        store: null,
        engagementStore: null,
        limiter: null,
      }),
    ).rejects.toThrow(ServiceUnavailableError);
  });

  it('publishes a review without exposing private feedback', async () => {
    const engagements = new FakeEngagementStore();
    engagements.put({
      id: engagementId,
      businessId: 'business-fake-001',
      specialistId: 'specialist-fake-001',
      state: 'completed',
      completedAt: new Date('2027-03-01T00:00:00Z'),
    });
    const reviews = new FakeReviewStore();

    const receipt = await submitReviewForEngagement({
      ...base,
      store: reviews,
      engagementStore: engagements,
      limiter: new FakeRateLimiter(),
    });
    const review = await reviews.get(receipt.id);

    expect(review).not.toBeNull();
    if (review === null) return;
    expect(review.party).toBe('business');
    expect(review.privateFeedback).toBe('Private note for Plugfindr');
    expect(JSON.stringify(toPublicReview(review))).not.toContain('Private note for Plugfindr');
  });
});
