import { ValidationError } from './errors';
import type { Kobo } from './ids';

export const REQUEST_CATEGORIES = [
  'design',
  'software',
  'marketing',
  'consulting',
  'finance',
  'creative',
  'operations',
] as const;

export const REQUEST_SCOPE_TYPES = [
  'one_off_project',
  'ongoing_retainer',
  'advisory',
  'not_sure',
] as const;

export type RequestCategory = (typeof REQUEST_CATEGORIES)[number];
export type RequestScopeType = (typeof REQUEST_SCOPE_TYPES)[number];

export type RequestBriefInput = {
  readonly brief: string;
  readonly category: RequestCategory;
  readonly scopeType: RequestScopeType;
  readonly timeline: string;
  readonly budgetMinKobo: Kobo | null;
  readonly budgetMaxKobo: Kobo | null;
  readonly budgetIsFlexible: boolean;
  readonly locationPreference: string | null;
  readonly mustHaveSkills: readonly string[];
  readonly niceToHaveSkills: readonly string[];
  readonly attachmentLinks: readonly string[];
};

export type ValidatedRequestBrief = RequestBriefInput & {
  readonly brief: string;
  readonly timeline: string;
};

function requireText(value: string, label: string, max: number): string {
  const trimmed = value.trim();
  if (trimmed.length === 0 || trimmed.length > max) {
    throw new ValidationError(`${label} must be between 1 and ${max} characters`);
  }
  return trimmed;
}

function validateSkillList(
  value: readonly string[],
  label: string,
  min: number,
): readonly string[] {
  if (value.length < min || value.length > 10) {
    throw new ValidationError(`${label} must contain between ${min} and 10 items`);
  }
  return value.map((item) => requireText(item, label, 60));
}

function validateLinks(value: readonly string[]): readonly string[] {
  if (value.length > 5) {
    throw new ValidationError('At most 5 links are allowed');
  }
  return value.map((item) => {
    const link = requireText(item, 'Link', 500);
    let parsed: URL;
    try {
      parsed = new URL(link);
    } catch {
      throw new ValidationError('Links must be valid URLs');
    }
    if (parsed.protocol !== 'https:') {
      throw new ValidationError('Links must use HTTPS');
    }
    return link;
  });
}

export function validateRequestBrief(input: RequestBriefInput): ValidatedRequestBrief {
  if (!REQUEST_CATEGORIES.includes(input.category)) {
    throw new ValidationError('Choose a valid category');
  }
  if (!REQUEST_SCOPE_TYPES.includes(input.scopeType)) {
    throw new ValidationError('Choose a valid scope');
  }

  const brief = requireText(input.brief, 'Brief', 2000);
  if (brief.length < 20) {
    throw new ValidationError('Brief must be at least 20 characters');
  }
  const timeline = requireText(input.timeline, 'Timeline', 120);

  if (input.budgetIsFlexible) {
    if (input.budgetMinKobo !== null || input.budgetMaxKobo !== null) {
      throw new ValidationError('Flexible budgets cannot include an amount');
    }
  } else {
    if (input.budgetMinKobo === null || input.budgetMaxKobo === null) {
      throw new ValidationError('Provide a budget range or choose not sure');
    }
    if (input.budgetMinKobo > input.budgetMaxKobo) {
      throw new ValidationError('Minimum budget cannot exceed maximum budget');
    }
  }

  const locationPreference =
    input.locationPreference === null
      ? null
      : requireText(input.locationPreference, 'Location preference', 120);

  return {
    ...input,
    brief,
    timeline,
    locationPreference,
    mustHaveSkills: validateSkillList(input.mustHaveSkills, 'Must-have skills', 1),
    niceToHaveSkills: validateSkillList(input.niceToHaveSkills, 'Nice-to-have skills', 0),
    attachmentLinks: validateLinks(input.attachmentLinks),
  };
}
