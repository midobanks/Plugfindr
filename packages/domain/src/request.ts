import type { StateChangedEvent } from './events';
import type { RequestId } from './ids';
import { transition } from './state-machine';
import type { StateTransition } from './state-machine';

export const REQUEST_STATES = [
  'submitted',
  'matching',
  'matches_ready',
  'in_conversation',
  'hired',
  'closed',
] as const;

export type RequestState = (typeof REQUEST_STATES)[number];

export const REQUEST_TRANSITIONS: Readonly<Record<RequestState, readonly RequestState[]>> = {
  submitted: ['matching'],
  matching: ['matches_ready'],
  matches_ready: ['in_conversation'],
  in_conversation: ['hired', 'closed'],
  hired: [],
  closed: [],
};

export type RequestStateChanged = StateChangedEvent<'RequestStateChanged', RequestState, RequestId>;

export function transitionRequest(
  current: RequestState,
  next: RequestState,
  requestId: RequestId,
  actorId: string,
  occurredAt: Date,
): StateTransition<RequestState, RequestStateChanged> {
  return transition(
    current,
    next,
    REQUEST_TRANSITIONS,
    'RequestStateChanged',
    requestId,
    actorId,
    occurredAt,
  );
}
