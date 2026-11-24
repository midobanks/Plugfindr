import type { RateLimiter, SpecialistProfileStore } from '@plugfindr/adapters';

const specialistProfileStore: SpecialistProfileStore | null = null;
const rateLimiter: RateLimiter | null = null;

export function getSpecialistProfileStore(): SpecialistProfileStore | null {
  return specialistProfileStore;
}

export function getSpecialistProfileRateLimiter(): RateLimiter | null {
  return rateLimiter;
}
