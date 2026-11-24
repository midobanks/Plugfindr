import {
  asKobo,
  AVAILABILITY_STATUSES,
  ENGAGEMENT_TYPES,
  RATE_VISIBILITIES,
  SPECIALIST_CATEGORIES,
  validateSpecialistProfile,
  ValidationError,
} from '@plugfindr/domain';
import type { ValidatedSpecialistProfile } from '@plugfindr/domain';
import { z } from 'zod';

const specialistProfileSchema = z.object({
  name: z.string().trim().min(2).max(120),
  headline: z.string().trim().min(20).max(160),
  category: z.enum(SPECIALIST_CATEGORIES),
  skills: z.array(z.string().trim().min(1).max(40)).min(3).max(12),
  bio: z.string().trim().min(80).max(1200),
  yearsExperience: z.number().int().min(0).max(50),
  location: z.string().trim().min(2).max(120),
  timeZone: z.string().trim().min(3).max(64),
  languages: z.array(z.string().trim().min(1).max(40)).min(1).max(5),
  availability: z.enum(AVAILABILITY_STATUSES),
  engagementTypes: z.array(z.enum(ENGAGEMENT_TYPES)).min(1).max(4),
  rateVisibility: z.enum(RATE_VISIBILITIES),
  rateMinKobo: z.number().int().nonnegative().nullable(),
  rateMaxKobo: z.number().int().nonnegative().nullable(),
  hideEmployer: z.boolean(),
});

export function parseSpecialistProfile(raw: unknown): ValidatedSpecialistProfile {
  const result = specialistProfileSchema.safeParse(raw);
  if (!result.success) {
    throw new ValidationError('Check the information you provided');
  }
  const input = result.data;
  return validateSpecialistProfile({
    name: input.name,
    headline: input.headline,
    category: input.category,
    skills: input.skills,
    bio: input.bio,
    yearsExperience: input.yearsExperience,
    location: input.location,
    timeZone: input.timeZone,
    languages: input.languages,
    availability: input.availability,
    engagementTypes: input.engagementTypes,
    rateVisibility: input.rateVisibility,
    rateMinKobo: input.rateMinKobo === null ? null : asKobo(input.rateMinKobo),
    rateMaxKobo: input.rateMaxKobo === null ? null : asKobo(input.rateMaxKobo),
    hideEmployer: input.hideEmployer,
  });
}
