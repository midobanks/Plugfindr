import { ValidationError } from '@plugfindr/domain';
import { z } from 'zod';

const introductionSchema = z
  .object({
    matchId: z.string().min(1).max(200),
    briefSummary: z.string().min(20).max(1000),
    budgetSummary: z.string().min(1).max(120).nullable(),
    timeline: z.string().min(1).max(120),
  })
  .strict();

export type ParsedIntroductionInput = z.infer<typeof introductionSchema>;

export function parseIntroductionInput(raw: unknown): ParsedIntroductionInput {
  const result = introductionSchema.safeParse(raw);
  if (!result.success) {
    throw new ValidationError('Check the introduction details');
  }
  return result.data;
}
