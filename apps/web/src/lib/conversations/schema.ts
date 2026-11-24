import { ValidationError } from '@plugfindr/domain';
import { z } from 'zod';

const messageSchema = z
  .object({
    body: z.string().trim().min(1).max(4000),
  })
  .strict();

export function parseMessageInput(raw: unknown): string {
  const result = messageSchema.safeParse(raw);
  if (!result.success) {
    throw new ValidationError('Check your message');
  }
  return result.data.body;
}
