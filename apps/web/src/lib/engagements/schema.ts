import { ENGAGEMENT_STATES, ValidationError } from '@plugfindr/domain';
import type { EngagementState } from '@plugfindr/domain';
import { z } from 'zod';

const statusSchema = z
  .object({
    state: z.enum(ENGAGEMENT_STATES),
  })
  .strict();

export function parseStatusInput(raw: unknown): EngagementState {
  const result = statusSchema.safeParse(raw);
  if (!result.success) {
    throw new ValidationError('Check the engagement status');
  }
  return result.data.state;
}
