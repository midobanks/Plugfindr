import { describe, expect, it } from 'vitest';
import { AuthorizationError, ValidationError } from './errors';
import { asId } from './ids';
import type { BusinessId, MatchId, RequestId, SpecialistId, UserId } from './ids';
import type { Match } from './matching';
import { recordMatchFeedback } from './match-feedback';

const now = new Date('2027-03-12T00:00:00Z');
const businessId = asId<BusinessId>('business-fake-001');
const specialistId = asId<SpecialistId>('specialist-fake-001');
const match: Match = {
  matchId: asId<MatchId>('request-fake-001:specialist-fake-001'),
  requestId: asId<RequestId>('request-fake-001'),
  specialistId,
  score: 88,
  stage: 'proposed',
  reasons: [],
  scoreBreakdown: [],
};

describe('match feedback', () => {
  it('allows only the business to give feedback', () => {
    expect(() =>
      recordMatchFeedback({
        match,
        businessId,
        actorId: asId<UserId>('specialist-fake-001'),
        verdict: 'relevant',
        reason: null,
        now,
      }),
    ).toThrow(AuthorizationError);
  });

  it('requires a reason when a match is not relevant', () => {
    expect(() =>
      recordMatchFeedback({
        match,
        businessId,
        actorId: asId<UserId>('business-fake-001'),
        verdict: 'not_relevant',
        reason: null,
        now,
      }),
    ).toThrow(ValidationError);
  });

  it('records trimmed feedback without changing the match score', () => {
    const feedback = recordMatchFeedback({
      match,
      businessId,
      actorId: asId<UserId>('business-fake-001'),
      verdict: 'not_relevant',
      reason: '  Specialist  is in   another industry.  ',
      now,
    });

    expect(feedback.matchId).toBe(match.matchId);
    expect(feedback.requestId).toBe(match.requestId);
    expect(feedback.reason).toBe('Specialist is in another industry.');
    expect(match.score).toBe(88);
  });
});
