import type { BusinessId, IntroductionId, RequestId } from './ids';
import { asId } from './ids';
import type { EngagementState } from './engagement';
import type { Match } from './matching';
import { ValidationError } from './errors';
import { transitionIntroduction } from './introduction';
import type { IntroductionState, IntroductionStateChanged } from './introduction';
import type { StateTransition } from './state-machine';

export const INTRODUCTION_RESPONSE_HOURS = 48;

export type Introduction = {
  readonly id: IntroductionId;
  readonly requestId: RequestId;
  readonly matchId: Match['matchId'];
  readonly businessId: BusinessId;
  readonly specialistId: Match['specialistId'];
  readonly state: IntroductionState;
  readonly briefSummary: string;
  readonly budgetSummary: string | null;
  readonly timeline: string;
  readonly declineReason: string | null;
  readonly createdAt: Date;
  readonly responseDueAt: Date;
  readonly conversationThreadId: string | null;
};

export type CreateIntroductionInput = {
  readonly match: Match;
  readonly businessId: BusinessId;
  readonly briefSummary: string;
  readonly budgetSummary: string | null;
  readonly timeline: string;
  readonly hasConflict: boolean;
  readonly isBlocked: boolean;
  readonly now: Date;
};

export type IntroductionAcceptance = {
  readonly transition: StateTransition<IntroductionState, IntroductionStateChanged>;
  readonly conversationThreadId: string;
};

export type ContactDetails = {
  readonly email: string;
  readonly phone: string;
  readonly whatsapp: string | null;
};

export type ContactVisibility = {
  readonly specialistShared: boolean;
  readonly engagementState: EngagementState | null;
};

export type ContactView = {
  readonly email: string;
  readonly phone: string;
  readonly whatsapp: string;
};

export type IntroductionView = {
  readonly id: IntroductionId;
  readonly state: IntroductionState;
  readonly briefSummary: string;
  readonly budgetSummary: string | null;
  readonly timeline: string;
  readonly responseDueAt: string;
  readonly conversationThreadId: string | null;
  readonly contact: ContactView;
};

const MASKED_CONTACT = 'Hidden until shared';
const REVEAL_STATES: readonly EngagementState[] = ['hired', 'in_progress', 'completed'];

function requireText(value: string, label: string, min: number, max: number): string {
  const trimmed = value.trim().replace(/\s+/gu, ' ');
  if (trimmed.length < min || trimmed.length > max) {
    throw new ValidationError(`${label} must be between ${min} and ${max} characters`);
  }
  return trimmed;
}

export function createIntroduction(input: CreateIntroductionInput): Introduction {
  if (input.hasConflict || input.isBlocked) {
    throw new ValidationError('This specialist cannot be introduced for this request');
  }
  if (input.match.stage === 'declined' || input.match.stage === 'expired') {
    throw new ValidationError('A closed match cannot be introduced');
  }

  return {
    id: asId<IntroductionId>(input.match.matchId),
    requestId: input.match.requestId,
    matchId: input.match.matchId,
    businessId: input.businessId,
    specialistId: input.match.specialistId,
    state: 'requested',
    briefSummary: requireText(input.briefSummary, 'Brief summary', 20, 1000),
    budgetSummary:
      input.budgetSummary === null
        ? null
        : requireText(input.budgetSummary, 'Budget summary', 1, 120),
    timeline: requireText(input.timeline, 'Timeline', 1, 120),
    declineReason: null,
    createdAt: input.now,
    responseDueAt: new Date(input.now.getTime() + INTRODUCTION_RESPONSE_HOURS * 60 * 60 * 1000),
    conversationThreadId: null,
  };
}

export function acceptIntroduction(
  introduction: Introduction,
  actorId: string,
  now: Date,
): IntroductionAcceptance {
  if (now.getTime() > introduction.responseDueAt.getTime()) {
    throw new ValidationError('Introduction response window has expired');
  }
  return {
    transition: transitionIntroduction(
      introduction.state,
      'accepted',
      introduction.id,
      actorId,
      now,
    ),
    conversationThreadId: `intro-thread:${introduction.id}`,
  };
}

export function declineIntroduction(
  introduction: Introduction,
  reason: string,
  actorId: string,
  now: Date,
): StateTransition<IntroductionState, IntroductionStateChanged> {
  requireText(reason, 'Decline reason', 3, 500);
  return transitionIntroduction(introduction.state, 'declined', introduction.id, actorId, now);
}

export function expireIntroduction(
  introduction: Introduction,
  actorId: string,
  now: Date,
): StateTransition<IntroductionState, IntroductionStateChanged> {
  if (now.getTime() < introduction.responseDueAt.getTime()) {
    throw new ValidationError('Introduction response window is still open');
  }
  return transitionIntroduction(introduction.state, 'expired', introduction.id, actorId, now);
}

export function canRevealIntroductionContact(visibility: ContactVisibility): boolean {
  return (
    visibility.specialistShared ||
    (visibility.engagementState !== null && REVEAL_STATES.includes(visibility.engagementState))
  );
}

export function toIntroductionView(
  introduction: Introduction,
  contact: ContactDetails,
  visibility: ContactVisibility,
): IntroductionView {
  const reveal = canRevealIntroductionContact(visibility);
  return {
    id: introduction.id,
    state: introduction.state,
    briefSummary: introduction.briefSummary,
    budgetSummary: introduction.budgetSummary,
    timeline: introduction.timeline,
    responseDueAt: introduction.responseDueAt.toISOString(),
    conversationThreadId: introduction.conversationThreadId,
    contact: {
      email: reveal ? contact.email : MASKED_CONTACT,
      phone: reveal ? contact.phone : MASKED_CONTACT,
      whatsapp: reveal ? (contact.whatsapp ?? MASKED_CONTACT) : MASKED_CONTACT,
    },
  };
}
