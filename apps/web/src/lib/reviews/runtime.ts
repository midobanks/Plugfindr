import type { EngagementStore, RateLimiter, ReviewStore } from '@plugfindr/adapters';

const reviewStore: ReviewStore | null = null;
const engagementStore: EngagementStore | null = null;
const limiter: RateLimiter | null = null;

export function getReviewStore(): ReviewStore | null {
  return reviewStore;
}

export function getEngagementStore(): EngagementStore | null {
  return engagementStore;
}

export function getReviewRateLimiter(): RateLimiter | null {
  return limiter;
}
