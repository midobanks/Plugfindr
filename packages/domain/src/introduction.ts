import type { StateChangedEvent } from './events';
import type { IntroductionId } from './ids';
import { transition } from './state-machine';
import type { StateTransition } from './state-machine';

export const INTRODUCTION_STATES = ['requested', 'accepted', 'declined', 'expired'] as const;

export type IntroductionState = (typeof INTRODUCTION_STATES)[number];

export const INTRODUCTION_TRANSITIONS: Readonly<
  Record<IntroductionState, readonly IntroductionState[]>
> = {
  requested: ['accepted', 'declined', 'expired'],
  accepted: [],
  declined: [],
  expired: [],
};

export type IntroductionStateChanged = StateChangedEvent<
  'IntroductionStateChanged',
  IntroductionState,
  IntroductionId
>;

export function transitionIntroduction(
  current: IntroductionState,
  next: IntroductionState,
  introductionId: IntroductionId,
  actorId: string,
  occurredAt: Date,
): StateTransition<IntroductionState, IntroductionStateChanged> {
  return transition(
    current,
    next,
    INTRODUCTION_TRANSITIONS,
    'IntroductionStateChanged',
    introductionId,
    actorId,
    occurredAt,
  );
}
