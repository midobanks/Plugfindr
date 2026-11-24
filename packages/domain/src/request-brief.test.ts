import { describe, expect, it } from 'vitest';
import { ValidationError } from './errors';
import { asKobo } from './ids';
import type { RequestBriefInput } from './request-brief';
import { validateRequestBrief } from './request-brief';

function makeBrief(overrides: Partial<RequestBriefInput> = {}): RequestBriefInput {
  return {
    brief: 'We need a product designer for a fintech onboarding flow in Lagos.',
    category: 'design',
    scopeType: 'one_off_project',
    timeline: 'Start in two weeks',
    budgetMinKobo: asKobo(25000000),
    budgetMaxKobo: asKobo(40000000),
    budgetIsFlexible: false,
    locationPreference: 'Remote, Africa/Lagos',
    mustHaveSkills: ['UI design', 'Figma'],
    niceToHaveSkills: ['Fintech'],
    attachmentLinks: ['https://example.test/brief'],
    ...overrides,
  };
}

describe('request brief validation', () => {
  it('accepts a complete brief with Unicode names', () => {
    const result = validateRequestBrief(
      makeBrief({
        brief: 'We need a designer who speaks ẹ̀dè Yorùbá to help with a Lagos onboarding flow.',
        mustHaveSkills: ['Ọ̀pọ̀ àṣà'],
      }),
    );

    expect(result.brief).toContain('ẹ̀dè Yorùbá');
    expect(result.mustHaveSkills).toEqual(['Ọ̀pọ̀ àṣà']);
  });

  it('requires a meaningful brief and a valid category', () => {
    expect(() => validateRequestBrief(makeBrief({ brief: 'Too short' }))).toThrow(ValidationError);
    expect(() =>
      validateRequestBrief(makeBrief({ category: 'unknown' as RequestBriefInput['category'] })),
    ).toThrow(ValidationError);
  });

  it('requires either a budget range or a flexible budget', () => {
    expect(() =>
      validateRequestBrief(makeBrief({ budgetMinKobo: null, budgetMaxKobo: null })),
    ).toThrow(ValidationError);
    expect(() => validateRequestBrief(makeBrief({ budgetMinKobo: asKobo(50000000) }))).toThrow(
      ValidationError,
    );
    expect(
      validateRequestBrief(
        makeBrief({
          budgetMinKobo: null,
          budgetMaxKobo: null,
          budgetIsFlexible: true,
        }),
      ).budgetIsFlexible,
    ).toBe(true);
  });

  it('rejects insecure links and empty must-have skills', () => {
    expect(() =>
      validateRequestBrief(makeBrief({ attachmentLinks: ['http://example.test'] })),
    ).toThrow(ValidationError);
    expect(() => validateRequestBrief(makeBrief({ mustHaveSkills: [] }))).toThrow(ValidationError);
  });
});
