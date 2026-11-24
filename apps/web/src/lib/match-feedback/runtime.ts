import type { MatchFeedbackStore, RateLimiter } from '@plugfindr/adapters';

const feedbackStore: MatchFeedbackStore | null = null;
const limiter: RateLimiter | null = null;

export function getMatchFeedbackStore(): MatchFeedbackStore | null {
  return feedbackStore;
}

export function getMatchFeedbackRateLimiter(): RateLimiter | null {
  return limiter;
}
