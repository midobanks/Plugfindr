import type { EngagementStore, RateLimiter } from '@plugfindr/adapters';

const engagementStore: EngagementStore | null = null;
const limiter: RateLimiter | null = null;

export function getEngagementStatusStore(): EngagementStore | null {
  return engagementStore;
}

export function getEngagementStatusRateLimiter(): RateLimiter | null {
  return limiter;
}
