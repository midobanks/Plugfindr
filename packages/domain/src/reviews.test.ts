import { describe, expect, it } from 'vitest';
import { reviewEligibility, REVIEW_DIMENSIONS, submitReview, toPublicReview } from './reviews';
import type { EngagementForReview, Rating, Review, ReviewRatings } from './reviews';
import { asId } from './ids';
import type { BusinessId, EngagementId, SpecialistId, UserId } from './ids';
import { AuthorizationError, ValidationError } from './errors';

const businessId = asId<BusinessId>('business-fake-001');
const specialistId = asId<SpecialistId>('specialist-fake-001');
const businessAuthorId = asId<UserId>('business-fake-001');
const specialistAuthorId = asId<UserId>('specialist-fake-001');
const now = new Date('2027-03-12T00:00:00Z');

const engagement: EngagementForReview = {
  id: asId<EngagementId>('engagement-fake-001'),
  businessId,
  specialistId,
  state: 'completed',
  completedAt: new Date('2027-03-01T00:00:00Z'),
};

const ratings: ReviewRatings = {
  quality: 5,
  communication: 4,
  reliability: 5,
  value: 4,
};

const base = {
  engagement,
  ratings,
  comment: 'Clear communication and the onboarding flow was delivered on time.',
  privateFeedback: null,
  now,
};

describe('review rules', () => {
  it('allows one review per party only after completion', () => {
    expect(reviewEligibility(engagement, businessAuthorId, [])).toBe('business');
    expect(reviewEligibility(engagement, specialistAuthorId, [])).toBe('specialist');
    expect(() =>
      reviewEligibility({ ...engagement, state: 'in_progress' }, businessAuthorId, []),
    ).toThrow(ValidationError);
    expect(() => reviewEligibility(engagement, asId<UserId>('user-fake-stranger'), [])).toThrow(
      AuthorizationError,
    );

    const existing: Review = submitReview({
      ...base,
      authorId: businessAuthorId,
      existingReviews: [],
    });
    expect(() => reviewEligibility(engagement, businessAuthorId, [existing])).toThrow(
      ValidationError,
    );
  });

  it('validates ratings and comment length', () => {
    expect(() =>
      submitReview({
        ...base,
        authorId: businessAuthorId,
        existingReviews: [],
        ratings: { ...ratings, quality: 6 as Rating },
      }),
    ).toThrow(ValidationError);
    expect(() =>
      submitReview({
        ...base,
        authorId: businessAuthorId,
        existingReviews: [],
        comment: 'Too short',
      }),
    ).toThrow(ValidationError);
  });

  it('omits private feedback from public reviews', () => {
    const review = submitReview({
      ...base,
      authorId: specialistAuthorId,
      existingReviews: [],
      privateFeedback: 'Private note for Plugfindr',
    });

    expect(REVIEW_DIMENSIONS.every((dimension) => review.ratings[dimension] >= 1)).toBe(true);
    const publicReview = toPublicReview(review);
    expect(publicReview.party).toBe('specialist');
    expect(JSON.stringify(publicReview)).not.toContain('Private note for Plugfindr');
    expect('privateFeedback' in publicReview).toBe(false);
  });
});
