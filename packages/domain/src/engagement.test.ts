import { describe, expect, it } from 'vitest';
import { InvalidTransitionError } from './errors';
import { asId } from './ids';
import type { EngagementId } from './ids';
import { transitionEngagement } from './engagement';

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
