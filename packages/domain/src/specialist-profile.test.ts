import { describe, expect, it } from 'vitest';
import {
  createSpecialistProfileSubmission,
  profileCompleteness,
  transitionSpecialistProfile,
  validateSpecialistProfile,
} from './specialist-profile';
import type { SpecialistProfileDraft } from './specialist-profile';
import { asId, asKobo, InvalidTransitionError, ValidationError } from './index';
import type { SpecialistId } from './index';

const now = new Date('2027-03-12T00:00:00Z');
const specialistId = asId<SpecialistId>('specialist-fake-001');

function makeDraft(overrides: Partial<SpecialistProfileDraft> = {}): SpecialistProfileDraft {
  return {
    name: 'Chidi Okoro',
    headline: 'Product designer for fintech and marketplace teams',
    category: 'design',
    skills: ['Product design', 'Figma', 'Design systems', 'Product design', 'Fintech'],
    bio: 'I design calm, usable products for teams building money and marketplace experiences in Africa.',
    yearsExperience: 7,
    location: 'Lagos, Nigeria',
    timeZone: 'Africa/Lagos',
    languages: ['English', 'Igbo'],
    availability: 'available_now',
    engagementTypes: ['project', 'retainer'],
    rateVisibility: 'range',
    rateMinKobo: asKobo(25000000),
    rateMaxKobo: asKobo(40000000),
    hideEmployer: true,
    ...overrides,
  };
}

describe('specialist profile rules', () => {
  it('calculates completeness and normalises a valid draft', () => {
    const draft = makeDraft();
    expect(profileCompleteness(draft)).toBe(100);

    const profile = validateSpecialistProfile(draft);
    expect(profile.skills).toEqual(['Product design', 'Figma', 'Design systems', 'Fintech']);
    expect(profile.rateMinKobo).toBe(25000000);
    expect(profile.hideEmployer).toBe(true);
  });

  it('accepts Unicode names and time zones', () => {
    const profile = validateSpecialistProfile(
      makeDraft({
        name: 'Ọ̀pọ̀ Balogun',
        location: 'Ibadan, Nigeria',
        languages: ['Yorùbá', 'English'],
      }),
    );
    expect(profile.name).toBe('Ọ̀pọ̀ Balogun');
    expect(profile.languages).toEqual(['Yorùbá', 'English']);
  });

  it('rejects incomplete and inconsistent drafts', () => {
    expect(() => validateSpecialistProfile(makeDraft({ skills: ['Figma'] }))).toThrow(
      ValidationError,
    );
    expect(() => validateSpecialistProfile(makeDraft({ availability: '' }))).toThrow(
      ValidationError,
    );
    expect(() => validateSpecialistProfile(makeDraft({ rateMaxKobo: asKobo(10000000) }))).toThrow(
      ValidationError,
    );
    expect(() => validateSpecialistProfile(makeDraft({ rateVisibility: 'on_request' }))).toThrow(
      ValidationError,
    );
  });

  it('submits as pending and never discoverable', () => {
    const submission = createSpecialistProfileSubmission(makeDraft());
    expect(submission.status).toBe('pending');
    expect(submission.discoverable).toBe(false);
  });

  it('validates profile state transitions', () => {
    expect(
      transitionSpecialistProfile('pending', 'approved', specialistId, 'reviewer-fake-001', now)
        .state,
    ).toBe('approved');
    expect(() =>
      transitionSpecialistProfile('pending', 'suspended', specialistId, 'reviewer-fake-001', now),
    ).toThrow(InvalidTransitionError);
  });
});
