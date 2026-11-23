import { describe, expect, it } from 'vitest';
import { InvalidTransitionError } from './errors';
import { asId } from './ids';
import type { RequestId } from './ids';
import { REQUEST_STATES, transitionRequest } from './request';

const requestId = asId<RequestId>('req-001');
const actorId = 'user-001';
const now = new Date('2027-03-12T00:00:00Z');

describe('request state machine', () => {
  it('walks the documented path from submitted to hired', () => {
    const matching = transitionRequest('submitted', 'matching', requestId, actorId, now);
    const ready = transitionRequest(matching.state, 'matches_ready', requestId, actorId, now);
    const conversation = transitionRequest(ready.state, 'in_conversation', requestId, actorId, now);
    const hired = transitionRequest(conversation.state, 'hired', requestId, actorId, now);

    expect(hired.state).toBe('hired');
    expect(REQUEST_STATES).toHaveLength(6);
  });

  it('allows closing a request that is in conversation', () => {
    const result = transitionRequest('in_conversation', 'closed', requestId, actorId, now);
    expect(result.state).toBe('closed');
  });

  it('rejects a skipped stage', () => {
    expect(() => transitionRequest('submitted', 'hired', requestId, actorId, now)).toThrow(
      InvalidTransitionError,
    );
  });

  it('rejects a backward transition', () => {
    expect(() => transitionRequest('matches_ready', 'matching', requestId, actorId, now)).toThrow(
      InvalidTransitionError,
    );
  });

  it('rejects leaving a terminal state', () => {
    expect(() => transitionRequest('closed', 'matching', requestId, actorId, now)).toThrow(
      InvalidTransitionError,
    );
    expect(() => transitionRequest('hired', 'closed', requestId, actorId, now)).toThrow(
      InvalidTransitionError,
    );
  });

  it('returns an event carrying the actor and timestamp', () => {
    const result = transitionRequest('submitted', 'matching', requestId, actorId, now);
    expect(result.event).toEqual({
      type: 'RequestStateChanged',
      id: requestId,
      from: 'submitted',
      to: 'matching',
      actorId,
      occurredAt: now,
    });
  });
});
