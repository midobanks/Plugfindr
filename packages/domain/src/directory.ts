import type { AvailabilityStatus, SpecialistCategory } from './specialist-profile';
import type { Badge, SpecialistProfileStatus, VerificationRecord } from './invariants';
import { deriveBadges, isSpecialistDiscoverable } from './invariants';
import type { Kobo, SpecialistId } from './ids';

export type PublicSpecialist = {
  readonly specialistId: SpecialistId;
  readonly name: string;
  readonly headline: string;
  readonly category: SpecialistCategory | null;
  readonly skills: readonly string[];
  readonly location: string | null;
  readonly availability: AvailabilityStatus | null;
  readonly yearsExperience: number | null;
  readonly rateFromKobo: Kobo | null;
  readonly badges: readonly Badge[];
};

export type DirectorySource = {
  readonly specialistId: SpecialistId;
  readonly name: string;
  readonly headline: string;
  readonly category: SpecialistCategory | null;
  readonly skills: readonly string[];
  readonly location: string | null;
  readonly availability: AvailabilityStatus | null;
  readonly yearsExperience: number | null;
  readonly rateFromKobo: Kobo | null;
  readonly profileStatus: SpecialistProfileStatus;
  readonly verifications: readonly VerificationRecord[];
};

export function toPublicSpecialist(source: DirectorySource, now: Date): PublicSpecialist | null {
  if (!isSpecialistDiscoverable(source.profileStatus, source.verifications, now)) return null;

  return {
    specialistId: source.specialistId,
    name: source.name,
    headline: source.headline,
    category: source.category,
    skills: source.skills,
    location: source.location,
    availability: source.availability,
    yearsExperience: source.yearsExperience,
    rateFromKobo: source.rateFromKobo,
    badges: deriveBadges(source.verifications, now),
  };
}
