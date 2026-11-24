import { describe, expect, it } from 'vitest';
import { AuthorizationError, InvalidTransitionError } from './errors';
import { asId } from './ids';
import type { BusinessId, EngagementId, SpecialistId, UserId } from './ids';
import { transitionEngagement, updateEngagementStatus } from './engagement';
import type { EngagementForStatus } from './engagement';

const engagementId = asId<EngagementId>('eng-001');
const actorId = 'user-001';
const now = new Date('2027-03-12T00:00:00Z');

describe('engagement state machine', () => {
  it('walks the documented path to completed', () => {
    const discussing = transitionEngagement(
      'introduced',
      'in_discussion',
      engagementId,
      actorId,
      now,
    );
    const hired = transitionEngagement(discussing.state, 'hired', engagementId, actorId, now);
    const inProgress = transitionEngagement(hired.state, 'in_progress', engagementId, actorId, now);
    const completed = transitionEngagement(
      inProgress.state,
      'completed',
      engagementId,
      actorId,
      now,
    );

    expect(completed.state).toBe('completed');
  });

  it('allows an in-progress engagement to stop', () => {
    expect(
      transitionEngagement('in_progress', 'not_proceeding', engagementId, actorId, now).state,
    ).toBe('not_proceeding');
  });

  it('rejects hiring before discussion', () => {
    expect(() => transitionEngagement('introduced', 'hired', engagementId, actorId, now)).toThrow(
      InvalidTransitionError,
    );
  });

  it('rejects completing an engagement that was never hired', () => {
    expect(() =>
      transitionEngagement('in_discussion', 'completed', engagementId, actorId, now),
    ).toThrow(InvalidTransitionError);
  });
});

describe('engagement status updates', () => {
  const businessId = asId<BusinessId>('business-fake-001');
  const specialistId = asId<SpecialistId>('specialist-fake-001');
  const engagement: EngagementForStatus = {
    id: engagementId,
    businessId,
    specialistId,
    state: 'in_progress',
  };

  it('accepts updates only from either party', () => {
    expect(
      updateEngagementStatus(engagement, 'completed', asId<UserId>('business-fake-001'), now)
        .transition.state,
    ).toBe('completed');
    expect(
      updateEngagementStatus(engagement, 'not_proceeding', asId<UserId>('specialist-fake-001'), now)
        .transition.state,
    ).toBe('not_proceeding');
    expect(() =>
      updateEngagementStatus(engagement, 'completed', asId<UserId>('user-fake-stranger'), now),
    ).toThrow(AuthorizationError);
  });

  it('records completion time only on completion', () => {
    expect(
      updateEngagementStatus(engagement, 'completed', asId<UserId>('business-fake-001'), now)
        .completedAt,
    ).toEqual(now);
    expect(
      updateEngagementStatus(engagement, 'not_proceeding', asId<UserId>('business-fake-001'), now)
        .completedAt,
    ).toBeNull();
  });
});
