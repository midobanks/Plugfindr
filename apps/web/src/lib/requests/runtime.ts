import type { RateLimiter, RequestStore } from '@plugfindr/adapters';

const requestStore: RequestStore | null = null;
const rateLimiter: RateLimiter | null = null;

export function getRequestStore(): RequestStore | null {
  return requestStore;
}

export function getRequestRateLimiter(): RateLimiter | null {
  return rateLimiter;
}
