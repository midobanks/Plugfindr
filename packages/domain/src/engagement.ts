import type { StateChangedEvent } from './events';
import type { EngagementId } from './ids';
import { transition } from './state-machine';
import type { StateTransition } from './state-machine';

export const ENGAGEMENT_STATES = [
  'introduced',
  'in_discussion',
  'hired',
  'in_progress',
  'completed',
  'not_proceeding',
] as const;

export type EngagementState = (typeof ENGAGEMENT_STATES)[number];

export const ENGAGEMENT_TRANSITIONS: Readonly<Record<EngagementState, readonly EngagementState[]>> =
  {
    introduced: ['in_discussion'],
    in_discussion: ['hired'],
    hired: ['in_progress'],
    in_progress: ['completed', 'not_proceeding'],
    completed: [],
    not_proceeding: [],
  };

export type EngagementStateChanged = StateChangedEvent<
  'EngagementStateChanged',
  EngagementState,
  EngagementId
>;

export function transitionEngagement(
  current: EngagementState,
  next: EngagementState,
  engagementId: EngagementId,
  actorId: string,
  occurredAt: Date,
): StateTransition<EngagementState, EngagementStateChanged> {
  return transition(
    current,
    next,
    ENGAGEMENT_TRANSITIONS,
    'EngagementStateChanged',
    engagementId,
    actorId,
    occurredAt,
  );
}
