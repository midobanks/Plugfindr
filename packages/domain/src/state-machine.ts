import { InvalidTransitionError } from './errors';
import type { StateChangedEvent } from './events';

export type StateTransition<TState extends string, TEvent> = {
  readonly state: TState;
  readonly event: TEvent;
};

export function transition<TState extends string, TEventType extends string, TId>(
  current: TState,
  next: TState,
  allowed: Readonly<Record<TState, readonly TState[]>>,
  eventType: TEventType,
  id: TId,
  actorId: string,
  occurredAt: Date,
): StateTransition<TState, StateChangedEvent<TEventType, TState, TId>> {
  const permitted = allowed[current];
  if (!permitted.includes(next)) {
    throw new InvalidTransitionError(current, next);
  }
  return {
    state: next,
    event: { type: eventType, id, from: current, to: next, actorId, occurredAt },
  };
}
