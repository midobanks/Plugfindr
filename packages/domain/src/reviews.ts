import type { BusinessId, EngagementId, ReviewId, SpecialistId, UserId } from './ids';
import { asId } from './ids';
import type { EngagementState } from './engagement';
import { AuthorizationError, ValidationError } from './errors';

export const REVIEW_DIMENSIONS = ['quality', 'communication', 'reliability', 'value'] as const;

export type ReviewDimension = (typeof REVIEW_DIMENSIONS)[number];
export type Rating = 1 | 2 | 3 | 4 | 5;
export type ReviewParty = 'business' | 'specialist';

export type ReviewRatings = Readonly<Record<ReviewDimension, Rating>>;

export type EngagementForReview = {
  readonly id: EngagementId;
  readonly businessId: BusinessId;
  readonly specialistId: SpecialistId;
  readonly state: EngagementState;
  readonly completedAt: Date | null;
};

export type Review = {
  readonly id: ReviewId;
  readonly engagementId: EngagementId;
  readonly specialistId: SpecialistId;
  readonly party: ReviewParty;
  readonly ratings: ReviewRatings;
  readonly comment: string;
  readonly privateFeedback: string | null;
  readonly createdAt: Date;
};

export type SubmitReviewInput = {
  readonly engagement: EngagementForReview;
  readonly authorId: UserId;
  readonly ratings: ReviewRatings;
  readonly comment: string;
  readonly privateFeedback: string | null;
  readonly existingReviews: readonly Review[];
  readonly now: Date;
};

export type PublicReview = {
  readonly id: ReviewId;
  readonly party: ReviewParty;
  readonly ratings: ReviewRatings;
  readonly comment: string;
  readonly createdAt: string;
};

function requireText(value: string, label: string, min: number, max: number): string {
  const trimmed = value.trim().replace(/\s+/gu, ' ');
  if (trimmed.length < min || trimmed.length > max) {
    throw new ValidationError(`${label} must be between ${min} and ${max} characters`);
  }
  return trimmed;
}

function partyFor(engagement: EngagementForReview, authorId: UserId): ReviewParty | null {
  const actor = String(authorId);
  if (String(engagement.businessId) === actor) return 'business';
  if (String(engagement.specialistId) === actor) return 'specialist';
  return null;
}

function validateRatings(ratings: ReviewRatings): ReviewRatings {
  const result = {} as Record<ReviewDimension, Rating>;
  for (const dimension of REVIEW_DIMENSIONS) {
    const value = ratings[dimension];
    if (!Number.isInteger(value) || value < 1 || value > 5) {
      throw new ValidationError(`${dimension} rating must be between 1 and 5`);
    }
    result[dimension] = value;
  }
  return result;
}

export function reviewEligibility(
  engagement: EngagementForReview,
  authorId: UserId,
  existingReviews: readonly Review[],
): ReviewParty {
  if (engagement.state !== 'completed' || engagement.completedAt === null) {
    throw new ValidationError('Reviews are available only after an engagement is completed');
  }
  const party = partyFor(engagement, authorId);
  if (party === null) {
    throw new AuthorizationError();
  }
  if (
    existingReviews.some(
      (review) => review.engagementId === engagement.id && review.party === party,
    )
  ) {
    throw new ValidationError('This party has already reviewed the engagement');
  }
  return party;
}

export function submitReview(input: SubmitReviewInput): Review {
  const party = reviewEligibility(input.engagement, input.authorId, input.existingReviews);
  return {
    id: asId<ReviewId>(`${input.engagement.id}:${party}`),
    engagementId: input.engagement.id,
    specialistId: input.engagement.specialistId,
    party,
    ratings: validateRatings(input.ratings),
    comment: requireText(input.comment, 'Comment', 20, 2000),
    privateFeedback:
      input.privateFeedback === null
        ? null
        : requireText(input.privateFeedback, 'Private feedback', 1, 2000),
    createdAt: input.now,
  };
}

export function toPublicReview(review: Review): PublicReview {
  return {
    id: review.id,
    party: review.party,
    ratings: review.ratings,
    comment: review.comment,
    createdAt: review.createdAt.toISOString(),
  };
}
