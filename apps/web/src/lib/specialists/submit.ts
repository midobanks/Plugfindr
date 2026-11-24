import type {
  RateLimiter,
  SpecialistProfileReceipt,
  SpecialistProfileStore,
} from '@plugfindr/adapters';
import { RateLimitError, ServiceUnavailableError } from '@plugfindr/domain';
import type { SpecialistId, ValidatedSpecialistProfile } from '@plugfindr/domain';

export async function submitSpecialistProfile(input: {
  store: SpecialistProfileStore | null;
  limiter: RateLimiter | null;
  specialistId: SpecialistId;
  profile: ValidatedSpecialistProfile;
  completeness: number;
  now: Date;
}): Promise<SpecialistProfileReceipt> {
  if (input.store === null || input.limiter === null) {
    throw new ServiceUnavailableError();
  }

  const decision = await input.limiter.check({
    key: `specialist-profile:${input.specialistId}`,
    now: input.now,
  });
  if (!decision.allowed) {
    throw new RateLimitError(decision.retryAfterSeconds);
  }

  return input.store.submit({
    specialistId: input.specialistId,
    profile: input.profile,
    submittedAt: input.now,
    completeness: input.completeness,
  });
}
