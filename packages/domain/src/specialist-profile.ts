import { ValidationError } from './errors';
import type { Kobo, SpecialistId } from './ids';
import type { SpecialistProfileStatus } from './invariants';
import { transition } from './state-machine';
import type { StateTransition } from './state-machine';
import type { StateChangedEvent } from './events';

export const SPECIALIST_CATEGORIES = [
  'design',
  'software',
  'marketing',
  'consulting',
  'finance',
  'creative',
  'operations',
] as const;
export type SpecialistCategory = (typeof SPECIALIST_CATEGORIES)[number];

export const AVAILABILITY_STATUSES = ['available_now', 'limited', 'booked'] as const;
export type AvailabilityStatus = (typeof AVAILABILITY_STATUSES)[number];

export const ENGAGEMENT_TYPES = ['project', 'retainer', 'part_time', 'advisory'] as const;
export type EngagementType = (typeof ENGAGEMENT_TYPES)[number];

export const RATE_VISIBILITIES = ['range', 'on_request'] as const;
export type RateVisibility = (typeof RATE_VISIBILITIES)[number];

export type SpecialistProfileDraft = {
  readonly name: string;
  readonly headline: string;
  readonly category: SpecialistCategory | '';
  readonly skills: readonly string[];
  readonly bio: string;
  readonly yearsExperience: number | null;
  readonly location: string;
  readonly timeZone: string;
  readonly languages: readonly string[];
  readonly availability: AvailabilityStatus | '';
  readonly engagementTypes: readonly EngagementType[];
  readonly rateVisibility: RateVisibility;
  readonly rateMinKobo: Kobo | null;
  readonly rateMaxKobo: Kobo | null;
  readonly hideEmployer: boolean;
};

export type ValidatedSpecialistProfile = {
  readonly name: string;
  readonly headline: string;
  readonly category: SpecialistCategory;
  readonly skills: readonly string[];
  readonly bio: string;
  readonly yearsExperience: number;
  readonly location: string;
  readonly timeZone: string;
  readonly languages: readonly string[];
  readonly availability: AvailabilityStatus;
  readonly engagementTypes: readonly EngagementType[];
  readonly rateVisibility: RateVisibility;
  readonly rateMinKobo: Kobo | null;
  readonly rateMaxKobo: Kobo | null;
  readonly hideEmployer: boolean;
};

export type SpecialistProfileSubmission = ValidatedSpecialistProfile & {
  readonly status: SpecialistProfileStatus;
  readonly discoverable: false;
};

export const SPECIALIST_PROFILE_STATES = ['pending', 'approved', 'suspended'] as const;

export const SPECIALIST_PROFILE_TRANSITIONS: Readonly<
  Record<SpecialistProfileStatus, readonly SpecialistProfileStatus[]>
> = {
  pending: ['approved'],
  approved: ['suspended'],
  suspended: ['approved'],
};

export type SpecialistProfileStateChanged = StateChangedEvent<
  'SpecialistProfileStateChanged',
  SpecialistProfileStatus,
  SpecialistId
>;

function clean(value: string): string {
  return value.trim().replace(/\s+/gu, ' ');
}

function cleanList(values: readonly string[]): readonly string[] {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const value of values) {
    const item = clean(value);
    if (item.length === 0 || seen.has(item.toLocaleLowerCase('en-NG'))) continue;
    seen.add(item.toLocaleLowerCase('en-NG'));
    result.push(item);
  }
  return result;
}

function requireLength(value: string, min: number, max: number, label: string): string {
  const result = clean(value);
  if (result.length < min || result.length > max) {
    throw new ValidationError(`${label} must be between ${min} and ${max} characters`);
  }
  return result;
}

export function profileCompleteness(draft: SpecialistProfileDraft): number {
  let score = 0;
  if (clean(draft.name).length >= 2) score += 10;
  if (clean(draft.headline).length >= 20) score += 10;
  if (draft.category !== '') score += 10;
  if (cleanList(draft.skills).length >= 3) score += 15;
  if (clean(draft.bio).length >= 80) score += 15;
  if (draft.yearsExperience !== null) score += 5;
  if (clean(draft.location).length > 0) score += 5;
  if (clean(draft.timeZone).length > 0) score += 5;
  if (cleanList(draft.languages).length > 0) score += 5;
  if (draft.availability !== '') score += 5;
  if (draft.engagementTypes.length > 0) score += 10;
  if (
    draft.rateVisibility === 'on_request' ||
    (draft.rateMinKobo !== null && draft.rateMaxKobo !== null)
  ) {
    score += 5;
  }
  return score;
}

export function validateSpecialistProfile(
  draft: SpecialistProfileDraft,
): ValidatedSpecialistProfile {
  const name = requireLength(draft.name, 2, 120, 'Name');
  const headline = requireLength(draft.headline, 20, 160, 'Headline');
  const bio = requireLength(draft.bio, 80, 1200, 'Bio');

  if (!SPECIALIST_CATEGORIES.includes(draft.category as SpecialistCategory)) {
    throw new ValidationError('Choose a valid primary category');
  }
  if (!AVAILABILITY_STATUSES.includes(draft.availability as AvailabilityStatus)) {
    throw new ValidationError('Choose a valid availability status');
  }

  const skills = cleanList(draft.skills);
  if (skills.length < 3 || skills.length > 12) {
    throw new ValidationError('Add between 3 and 12 skills');
  }
  if (skills.some((skill) => skill.length > 40)) {
    throw new ValidationError('Skills must be 40 characters or fewer');
  }

  const languages = cleanList(draft.languages);
  if (languages.length < 1 || languages.length > 5) {
    throw new ValidationError('Add between 1 and 5 languages');
  }

  const engagementTypes = [...new Set(draft.engagementTypes)];
  if (engagementTypes.length < 1) {
    throw new ValidationError('Choose at least one engagement type');
  }
  if (engagementTypes.some((type) => !ENGAGEMENT_TYPES.includes(type))) {
    throw new ValidationError('Choose valid engagement types');
  }

  const yearsExperience = draft.yearsExperience;
  if (
    yearsExperience === null ||
    !Number.isInteger(yearsExperience) ||
    yearsExperience < 0 ||
    yearsExperience > 50
  ) {
    throw new ValidationError('Years of experience must be between 0 and 50');
  }

  const location = requireLength(draft.location, 2, 120, 'Location');
  const timeZone = requireLength(draft.timeZone, 3, 64, 'Time zone');

  if (draft.rateVisibility === 'range') {
    if (draft.rateMinKobo === null || draft.rateMaxKobo === null) {
      throw new ValidationError('Add a rate range or choose on request');
    }
    if (draft.rateMaxKobo < draft.rateMinKobo) {
      throw new ValidationError('The maximum rate cannot be lower than the minimum rate');
    }
  } else if (draft.rateMinKobo !== null || draft.rateMaxKobo !== null) {
    throw new ValidationError('Clear the rate range when rates are on request');
  }

  return {
    name,
    headline,
    category: draft.category as SpecialistCategory,
    skills,
    bio,
    yearsExperience,
    location,
    timeZone,
    languages,
    availability: draft.availability as AvailabilityStatus,
    engagementTypes,
    rateVisibility: draft.rateVisibility,
    rateMinKobo: draft.rateMinKobo,
    rateMaxKobo: draft.rateMaxKobo,
    hideEmployer: draft.hideEmployer,
  };
}

export function createSpecialistProfileSubmission(
  draft: SpecialistProfileDraft,
): SpecialistProfileSubmission {
  return {
    ...validateSpecialistProfile(draft),
    status: 'pending',
    discoverable: false,
  };
}

export function transitionSpecialistProfile(
  current: SpecialistProfileStatus,
  next: SpecialistProfileStatus,
  specialistId: SpecialistId,
  actorId: string,
  occurredAt: Date,
): StateTransition<SpecialistProfileStatus, SpecialistProfileStateChanged> {
  return transition(
    current,
    next,
    SPECIALIST_PROFILE_TRANSITIONS,
    'SpecialistProfileStateChanged',
    specialistId,
    actorId,
    occurredAt,
  );
}
