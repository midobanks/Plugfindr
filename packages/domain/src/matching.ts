import type { SpecialistId, MatchId, RequestId, Kobo } from './ids';
import { asId } from './ids';
import type { VerificationRecord, SpecialistProfileStatus } from './invariants';
import { isSpecialistDiscoverable } from './invariants';
import type { AvailabilityStatus, SpecialistCategory } from './specialist-profile';
import type { ValidatedRequestBrief } from './request-brief';
import { ValidationError } from './errors';
import { transition } from './state-machine';
import type { StateTransition } from './state-machine';
import type { StateChangedEvent } from './events';

export type MatchStage = 'proposed' | 'opted_in' | 'confirmed' | 'declined' | 'expired';

export const MATCH_STAGES = ['proposed', 'opted_in', 'confirmed', 'declined', 'expired'] as const;

export const MATCH_TRANSITIONS: Readonly<Record<MatchStage, readonly MatchStage[]>> = {
  proposed: ['opted_in', 'declined', 'expired'],
  opted_in: ['confirmed', 'declined', 'expired'],
  confirmed: [],
  declined: [],
  expired: [],
};

export type MatchFactorCode =
  | 'category_fit'
  | 'must_have_skills'
  | 'nice_to_have_skills'
  | 'availability'
  | 'budget_fit'
  | 'location_fit'
  | 'verification'
  | 'experience';

export type ScoreFactor = {
  readonly code: MatchFactorCode;
  readonly points: number;
  readonly maxPoints: number;
};

export type MatchReason = {
  readonly code: MatchFactorCode;
  readonly message: string;
};

export type MatchCandidate = {
  readonly specialistId: SpecialistId;
  readonly name: string;
  readonly category: SpecialistCategory;
  readonly skills: readonly string[];
  readonly availability: AvailabilityStatus;
  readonly location: string | null;
  readonly yearsExperience: number;
  readonly rateMinKobo: Kobo | null;
  readonly rateMaxKobo: Kobo | null;
  readonly profileStatus: SpecialistProfileStatus;
  readonly verifications: readonly VerificationRecord[];
  readonly hasConflict: boolean;
  readonly isBlocked: boolean;
};

export type Match = {
  readonly matchId: MatchId;
  readonly requestId: RequestId;
  readonly specialistId: SpecialistId;
  readonly score: number;
  readonly stage: MatchStage;
  readonly reasons: readonly MatchReason[];
  readonly scoreBreakdown: readonly ScoreFactor[];
};

export type ShortlistInput = {
  readonly requestId: RequestId;
  readonly request: ValidatedRequestBrief;
  readonly candidates: readonly MatchCandidate[];
  readonly excludedSpecialistIds?: readonly SpecialistId[];
  readonly now: Date;
  readonly limit?: number;
};

export type MatchStateChanged = StateChangedEvent<'MatchStateChanged', MatchStage, MatchId>;

const FACTOR_WEIGHTS: Readonly<Record<MatchFactorCode, number>> = {
  category_fit: 15,
  must_have_skills: 25,
  nice_to_have_skills: 10,
  availability: 10,
  budget_fit: 15,
  location_fit: 10,
  verification: 10,
  experience: 5,
};

const REASON_PRIORITY: Readonly<Record<MatchFactorCode, number>> = {
  must_have_skills: 1,
  category_fit: 2,
  verification: 3,
  budget_fit: 4,
  availability: 5,
  location_fit: 6,
  nice_to_have_skills: 7,
  experience: 8,
};

function normalise(value: string): string {
  return value.trim().toLocaleLowerCase('en-NG');
}

function overlapCount(skills: readonly string[], wanted: readonly string[]): number {
  if (wanted.length === 0) return 0;
  const available = new Set(skills.map(normalise));
  return (
    new Set(wanted.map(normalise)).size -
    [...new Set(wanted.map(normalise))].filter((skill) => !available.has(skill)).length
  );
}

function rangesOverlap(
  requestMin: Kobo | null,
  requestMax: Kobo | null,
  candidateMin: Kobo | null,
  candidateMax: Kobo | null,
): boolean {
  if (
    requestMin === null ||
    requestMax === null ||
    candidateMin === null ||
    candidateMax === null
  ) {
    return false;
  }
  return requestMin <= candidateMax && candidateMin <= requestMax;
}

function scoreFactors(input: ShortlistInput, candidate: MatchCandidate): readonly ScoreFactor[] {
  const { request, now } = input;
  const mustHaves = overlapCount(candidate.skills, request.mustHaveSkills);
  const niceToHaves = overlapCount(candidate.skills, request.niceToHaveSkills);
  const availabilityPoints =
    candidate.availability === 'available_now'
      ? FACTOR_WEIGHTS.availability
      : candidate.availability === 'limited'
        ? 5
        : 0;
  const budgetPoints = rangesOverlap(
    request.budgetMinKobo,
    request.budgetMaxKobo,
    candidate.rateMinKobo,
    candidate.rateMaxKobo,
  )
    ? FACTOR_WEIGHTS.budget_fit
    : request.budgetIsFlexible
      ? 8
      : 0;
  const preference =
    request.locationPreference === null ? null : normalise(request.locationPreference);
  const location = candidate.location === null ? null : normalise(candidate.location);
  const locationPoints =
    preference !== null &&
    location !== null &&
    (location.includes(preference) || preference.includes(location))
      ? FACTOR_WEIGHTS.location_fit
      : 0;
  const verificationPoints = isSpecialistDiscoverable(
    candidate.profileStatus,
    candidate.verifications,
    now,
  )
    ? FACTOR_WEIGHTS.verification
    : 0;
  const experiencePoints = Math.min(candidate.yearsExperience / 5, 1) * FACTOR_WEIGHTS.experience;

  return [
    {
      code: 'category_fit',
      points: candidate.category === request.category ? FACTOR_WEIGHTS.category_fit : 0,
      maxPoints: FACTOR_WEIGHTS.category_fit,
    },
    {
      code: 'must_have_skills',
      points:
        request.mustHaveSkills.length === 0
          ? 0
          : (mustHaves / request.mustHaveSkills.length) * FACTOR_WEIGHTS.must_have_skills,
      maxPoints: FACTOR_WEIGHTS.must_have_skills,
    },
    {
      code: 'nice_to_have_skills',
      points:
        request.niceToHaveSkills.length === 0
          ? 0
          : (niceToHaves / request.niceToHaveSkills.length) * FACTOR_WEIGHTS.nice_to_have_skills,
      maxPoints: FACTOR_WEIGHTS.nice_to_have_skills,
    },
    { code: 'availability', points: availabilityPoints, maxPoints: FACTOR_WEIGHTS.availability },
    { code: 'budget_fit', points: budgetPoints, maxPoints: FACTOR_WEIGHTS.budget_fit },
    { code: 'location_fit', points: locationPoints, maxPoints: FACTOR_WEIGHTS.location_fit },
    { code: 'verification', points: verificationPoints, maxPoints: FACTOR_WEIGHTS.verification },
    { code: 'experience', points: experiencePoints, maxPoints: FACTOR_WEIGHTS.experience },
  ];
}

function reasonFor(
  factor: ScoreFactor,
  input: ShortlistInput,
  candidate: MatchCandidate,
): MatchReason {
  const { request } = input;
  const mustHaves = overlapCount(candidate.skills, request.mustHaveSkills);
  const niceToHaves = overlapCount(candidate.skills, request.niceToHaveSkills);

  switch (factor.code) {
    case 'category_fit':
      return { code: factor.code, message: `Works in ${candidate.category}` };
    case 'must_have_skills':
      return {
        code: factor.code,
        message: `Matches ${mustHaves} of ${request.mustHaveSkills.length} must-have skills`,
      };
    case 'nice_to_have_skills':
      return {
        code: factor.code,
        message: `Also brings ${niceToHaves} of ${request.niceToHaveSkills.length} nice-to-have skills`,
      };
    case 'availability':
      return {
        code: factor.code,
        message:
          candidate.availability === 'available_now' ? 'Available now' : 'Has limited availability',
      };
    case 'budget_fit':
      return {
        code: factor.code,
        message: request.budgetIsFlexible ? 'Budget is flexible' : 'Rate range fits the brief',
      };
    case 'location_fit':
      return {
        code: factor.code,
        message: `Based in ${candidate.location ?? 'the preferred area'}`,
      };
    case 'verification':
      return { code: factor.code, message: 'Identity verified' };
    case 'experience':
      return {
        code: factor.code,
        message: `Brings ${candidate.yearsExperience} years of experience`,
      };
  }
}

function reasonsFor(
  factors: readonly ScoreFactor[],
  input: ShortlistInput,
  candidate: MatchCandidate,
): readonly MatchReason[] {
  return factors
    .filter((factor) => factor.points > 0)
    .slice()
    .sort((left, right) => REASON_PRIORITY[left.code] - REASON_PRIORITY[right.code])
    .slice(0, 3)
    .map((factor) => reasonFor(factor, input, candidate));
}

export function scoreCandidate(input: ShortlistInput, candidate: MatchCandidate): Match {
  const scoreBreakdown = scoreFactors(input, candidate);
  const score = Math.round(scoreBreakdown.reduce((total, factor) => total + factor.points, 0));
  return {
    matchId: asId<MatchId>(`${input.requestId}:${candidate.specialistId}`),
    requestId: input.requestId,
    specialistId: candidate.specialistId,
    score,
    stage: 'proposed',
    reasons: reasonsFor(scoreBreakdown, input, candidate),
    scoreBreakdown,
  };
}

export function buildShortlist(input: ShortlistInput): readonly Match[] {
  const limit = Math.min(Math.max(input.limit ?? 5, 1), 10);
  const excluded = new Set<string>(input.excludedSpecialistIds ?? []);

  return input.candidates
    .filter(
      (candidate) =>
        !candidate.hasConflict &&
        !candidate.isBlocked &&
        !excluded.has(candidate.specialistId) &&
        isSpecialistDiscoverable(candidate.profileStatus, candidate.verifications, input.now),
    )
    .map((candidate) => scoreCandidate(input, candidate))
    .sort(
      (left, right) =>
        right.score - left.score || left.specialistId.localeCompare(right.specialistId),
    )
    .slice(0, limit);
}

function transitionMatch(
  match: Match,
  next: MatchStage,
  actorId: string,
  occurredAt: Date,
): StateTransition<MatchStage, MatchStateChanged> {
  return transition(
    match.stage,
    next,
    MATCH_TRANSITIONS,
    'MatchStateChanged',
    match.matchId,
    actorId,
    occurredAt,
  );
}

export function recordMatchOptIn(
  match: Match,
  actorId: string,
  occurredAt: Date,
): StateTransition<MatchStage, MatchStateChanged> {
  return transitionMatch(match, 'opted_in', actorId, occurredAt);
}

export function confirmMatch(
  match: Match,
  actorId: string,
  occurredAt: Date,
): StateTransition<MatchStage, MatchStateChanged> {
  if (match.stage !== 'opted_in') {
    throw new ValidationError('Specialist must opt in before a match can be confirmed');
  }
  return transitionMatch(match, 'confirmed', actorId, occurredAt);
}

export function declineMatch(
  match: Match,
  actorId: string,
  occurredAt: Date,
): StateTransition<MatchStage, MatchStateChanged> {
  return transitionMatch(match, 'declined', actorId, occurredAt);
}
