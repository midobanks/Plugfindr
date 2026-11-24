import { MATCH_FEEDBACK_VERDICTS, ValidationError } from '@plugfindr/domain';
import type { MatchFeedbackVerdict } from '@plugfindr/domain';
import { z } from 'zod';

export type ParsedMatchFeedback = {
  readonly verdict: MatchFeedbackVerdict;
  readonly reason: string | null;
};

const feedbackSchema = z
  .object({
    verdict: z.enum(MATCH_FEEDBACK_VERDICTS),
    reason: z.string().max(500).nullable().optional(),
  })
  .strict();

export function parseMatchFeedbackInput(raw: unknown): ParsedMatchFeedback {
  const result = feedbackSchema.safeParse(raw);
  if (!result.success) {
    throw new ValidationError('Check your match feedback');
  }
  return { verdict: result.data.verdict, reason: result.data.reason ?? null };
}
