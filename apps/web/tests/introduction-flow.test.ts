import { FakeIntroductionStore, FakeMatchStore, FakeRateLimiter } from '@plugfindr/adapters';
import { asId, ServiceUnavailableError } from '@plugfindr/domain';
import type {
  BusinessId,
  Match,
  MatchId,
  RequestId,
  SpecialistId,
  UserId,
} from '@plugfindr/domain';
import { describe, expect, it } from 'vitest';
import { submitIntroduction } from '../src/lib/introductions/submit';

const now = new Date('2027-03-12T00:00:00Z');
const requestId = asId<RequestId>('request-fake-001');
const specialistId = asId<SpecialistId>('specialist-fake-001');
const matchId = asId<MatchId>('match-fake-001');

const match: Match = {
  matchId,
  requestId,
  specialistId,
  score: 88,
  stage: 'proposed',
  reasons: [],
  scoreBreakdown: [],
};

const base = {
  actorId: asId<UserId>('user-fake-001'),
  matchId: 'match-fake-001',
  briefSummary: 'We need a product designer to refresh our fintech onboarding flow.',
  budgetSummary: '₦200,000 to ₦300,000',
  timeline: 'From March 2027',
  now,
};

describe('introduction submission', () => {
  it('returns 503 scaffolding until stores are connected', async () => {
    await expect(
      submitIntroduction({ ...base, store: null, limiter: null, matchStore: null }),
    ).rejects.toThrow(ServiceUnavailableError);
  });

  it('creates an introduction without returning contact details', async () => {
    const introductions = new FakeIntroductionStore();
    const matches = new FakeMatchStore();
    await matches.saveShortlist(requestId, [match]);

    const receipt = await submitIntroduction({
      ...base,
      store: introductions,
      limiter: new FakeRateLimiter(),
      matchStore: matches,
    });

    expect(receipt.state).toBe('requested');
    expect(JSON.stringify(receipt)).not.toContain('phone');
    expect(JSON.stringify(receipt)).not.toContain('email');
    expect((await introductions.get(receipt.id))?.businessId).toBe('user-fake-001');
    expect((await introductions.get(receipt.id))?.businessId as BusinessId).toBeDefined();
  });
});
