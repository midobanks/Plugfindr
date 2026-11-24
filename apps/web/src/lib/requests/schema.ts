import {
  asKobo,
  REQUEST_CATEGORIES,
  REQUEST_SCOPE_TYPES,
  validateRequestBrief,
  ValidationError,
} from '@plugfindr/domain';
import type { ValidatedRequestBrief } from '@plugfindr/domain';
import { z } from 'zod';

const requestBriefSchema = z.object({
  brief: z.string().trim().min(20).max(2000),
  category: z.enum(REQUEST_CATEGORIES),
  scopeType: z.enum(REQUEST_SCOPE_TYPES),
  timeline: z.string().trim().min(1).max(120),
  budgetMinKobo: z.number().int().nonnegative().nullable(),
  budgetMaxKobo: z.number().int().nonnegative().nullable(),
  budgetIsFlexible: z.boolean(),
  locationPreference: z.string().trim().max(120).nullable(),
  mustHaveSkills: z.array(z.string().trim().min(1).max(60)).min(1).max(10),
  niceToHaveSkills: z.array(z.string().trim().min(1).max(60)).max(10).default([]),
  attachmentLinks: z.array(z.string().trim().url().max(500)).max(5).default([]),
});

export function parseRequestBrief(raw: unknown): ValidatedRequestBrief {
  const result = requestBriefSchema.safeParse(raw);
  if (!result.success) {
    throw new ValidationError('Check the information you provided');
  }
  const input = result.data;
  return validateRequestBrief({
    brief: input.brief,
    category: input.category,
    scopeType: input.scopeType,
    timeline: input.timeline,
    budgetMinKobo: input.budgetMinKobo === null ? null : asKobo(input.budgetMinKobo),
    budgetMaxKobo: input.budgetMaxKobo === null ? null : asKobo(input.budgetMaxKobo),
    budgetIsFlexible: input.budgetIsFlexible,
    locationPreference: input.locationPreference,
    mustHaveSkills: input.mustHaveSkills,
    niceToHaveSkills: input.niceToHaveSkills,
    attachmentLinks: input.attachmentLinks,
  });
}
