import type { StateChangedEvent } from './events';
import type { BusinessId, EngagementId, SpecialistId, UserId } from './ids';
import { AuthorizationError } from './errors';
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

export type EngagementParty = 'business' | 'specialist';

export type EngagementForStatus = {
  readonly id: EngagementId;
  readonly businessId: BusinessId;
  readonly specialistId: SpecialistId;
  readonly state: EngagementState;
};

export type EngagementStatusUpdate = {
  readonly transition: StateTransition<EngagementState, EngagementStateChanged>;
  readonly completedAt: Date | null;
};

export function engagementPartyFor(
  engagement: EngagementForStatus,
  actorId: UserId,
): EngagementParty {
  const actor = String(actorId);
  if (String(engagement.businessId) === actor) return 'business';
  if (String(engagement.specialistId) === actor) return 'specialist';
  throw new AuthorizationError();
}

export function updateEngagementStatus(
  engagement: EngagementForStatus,
  next: EngagementState,
  actorId: UserId,
  occurredAt: Date,
): EngagementStatusUpdate {
  const party = engagementPartyFor(engagement, actorId);
  return {
    transition: transitionEngagement(engagement.state, next, engagement.id, party, occurredAt),
    completedAt: next === 'completed' ? occurredAt : null,
  };
}
