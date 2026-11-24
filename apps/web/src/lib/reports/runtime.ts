import type { RateLimiter } from '@plugfindr/adapters';
import type { ReportStore } from '@plugfindr/adapters';

const reportStore: ReportStore | null = null;
const limiter: RateLimiter | null = null;

export function getReportStore(): ReportStore | null {
  return reportStore;
}

export function getReportRateLimiter(): RateLimiter | null {
  return limiter;
}
