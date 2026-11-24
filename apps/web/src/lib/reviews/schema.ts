import { ValidationError } from '@plugfindr/domain';
import type { ReviewRatings } from '@plugfindr/domain';
import { z } from 'zod';

const ratingSchema = z.number().int().min(1).max(5);

const reviewSchema = z
  .object({
    engagementId: z.string().min(1).max(200),
    ratings: z.object({
      quality: ratingSchema,
      communication: ratingSchema,
      reliability: ratingSchema,
      value: ratingSchema,
    }),
    comment: z.string().trim().min(20).max(2000),
    privateFeedback: z.string().trim().min(1).max(2000).nullable(),
  })
  .strict();

export type ParsedReviewInput = Omit<z.infer<typeof reviewSchema>, 'ratings'> & {
  readonly ratings: ReviewRatings;
};

export function parseReviewInput(raw: unknown): ParsedReviewInput {
  const result = reviewSchema.safeParse(raw);
  if (!result.success) {
    throw new ValidationError('Check the review details');
  }
  return { ...result.data, ratings: result.data.ratings as ReviewRatings };
}
