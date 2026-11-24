import type { RateLimiter, RequestReceipt, RequestStore } from '@plugfindr/adapters';
import { RateLimitError, ServiceUnavailableError } from '@plugfindr/domain';
import type { UserId, ValidatedRequestBrief } from '@plugfindr/domain';

export async function submitRequest(input: {
  store: RequestStore | null;
  limiter: RateLimiter | null;
  actorId: UserId;
  brief: ValidatedRequestBrief;
  now: Date;
}): Promise<RequestReceipt> {
  if (input.store === null || input.limiter === null) {
    throw new ServiceUnavailableError();
  }

  const decision = await input.limiter.check({
    key: `request:${input.actorId}`,
    now: input.now,
  });
  if (!decision.allowed) {
    throw new RateLimitError(decision.retryAfterSeconds);
  }

  return input.store.create({
    actorId: input.actorId,
    brief: input.brief,
    submittedAt: input.now,
  });
}
