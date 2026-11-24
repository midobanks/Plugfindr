import type { IntroductionStore, MatchStore, RateLimiter } from '@plugfindr/adapters';

const introductionStore: IntroductionStore | null = null;
const limiter: RateLimiter | null = null;
const matchStore: MatchStore | null = null;

export function getIntroductionStore(): IntroductionStore | null {
  return introductionStore;
}

export function getIntroductionRateLimiter(): RateLimiter | null {
  return limiter;
}

export function getMatchStore(): MatchStore | null {
  return matchStore;
}
