import { FakeMatchFeedbackStore, FakeMatchStore, FakeRateLimiter } from '@plugfindr/adapters';
import {
  asId,
  AuthorizationError,
  ServiceUnavailableError,
  ValidationError,
} from '@plugfindr/domain';
import type { BusinessId, MatchId, RequestId, SpecialistId, UserId } from '@plugfindr/domain';
import type { Match } from '@plugfindr/domain';
import { describe, expect, it } from 'vitest';
import { submitMatchFeedback } from '../src/lib/match-feedback/submit';

const now = new Date('2027-03-12T00:00:00Z');
const matchId = asId<MatchId>('request-fake-001:specialist-fake-001');
const businessId = asId<BusinessId>('business-fake-001');

const match: Match = {
  matchId,
  requestId: asId<RequestId>('request-fake-001'),
  specialistId: asId<SpecialistId>('specialist-fake-001'),
  score: 88,
  stage: 'proposed',
  reasons: [],
  scoreBreakdown: [],
};

function matchStore(): FakeMatchStore {
  const store = new FakeMatchStore();
  void store.saveShortlist(match.requestId, [match], businessId);
  return store;
}

describe('match feedback submission', () => {
  it('returns 503 scaffolding until stores are connected', async () => {
    await expect(
      submitMatchFeedback({
        matchStore: null,
        feedbackStore: null,
        limiter: null,
        actorId: asId<UserId>('business-fake-001'),
        matchId: matchId,
        verdict: 'relevant',
        reason: null,
        now,
      }),
    ).rejects.toThrow(ServiceUnavailableError);
  });

  it('stores feedback from the business without altering ranking', async () => {
    const store = new FakeMatchFeedbackStore();
    const receipt = await submitMatchFeedback({
      matchStore: matchStore(),
      feedbackStore: store,
      limiter: new FakeRateLimiter(),
      actorId: asId<UserId>('business-fake-001'),
      matchId: matchId,
      verdict: 'not_relevant',
      reason: 'Needs a different specialist category.',
      now,
    });

    expect(receipt.verdict).toBe('not_relevant');
    expect((await store.listForMatch(matchId))[0]?.reason).toBe(
      'Needs a different specialist category.',
    );
    expect(match.score).toBe(88);
  });

  it('rejects non-business actors and missing matches', async () => {
    await expect(
      submitMatchFeedback({
        matchStore: matchStore(),
        feedbackStore: new FakeMatchFeedbackStore(),
        limiter: new FakeRateLimiter(),
        actorId: asId<UserId>('specialist-fake-001'),
        matchId: matchId,
        verdict: 'relevant',
        reason: null,
        now,
      }),
    ).rejects.toThrow(AuthorizationError);

    await expect(
      submitMatchFeedback({
        matchStore: matchStore(),
        feedbackStore: new FakeMatchFeedbackStore(),
        limiter: new FakeRateLimiter(),
        actorId: asId<UserId>('business-fake-001'),
        matchId: 'match-fake-missing',
        verdict: 'relevant',
        reason: null,
        now,
      }),
    ).rejects.toThrow(ValidationError);
  });
});
