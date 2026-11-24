import { describe, expect, it } from 'vitest';
import {
  buildShortlist,
  confirmMatch,
  declineMatch,
  recordMatchOptIn,
  scoreCandidate,
} from './matching';
import type { MatchCandidate, ShortlistInput } from './matching';
import { asId, asKobo } from './ids';
import type { BusinessId, RequestId, SpecialistId, VerificationId } from './ids';
import type { VerificationRecord } from './invariants';
import type { ValidatedRequestBrief } from './request-brief';
import { InvalidTransitionError, ValidationError } from './errors';

const now = new Date('2027-03-12T00:00:00Z');
const requestId = asId<RequestId>('request-fake-001');
const actorId = asId<BusinessId>('business-fake-001');

const request: ValidatedRequestBrief = {
  brief: 'We need a product designer to refresh our fintech onboarding flow.',
  category: 'design',
  scopeType: 'one_off_project',
  timeline: 'From March 2027',
  budgetMinKobo: asKobo(20000000),
  budgetMaxKobo: asKobo(30000000),
  budgetIsFlexible: false,
  locationPreference: 'Lagos',
  mustHaveSkills: ['Product design', 'Figma'],
  niceToHaveSkills: ['Design systems'],
  attachmentLinks: [],
};

function verification(specialistId: SpecialistId): VerificationRecord {
  return {
    id: asId<VerificationId>(`verification-${specialistId}`),
    specialistId,
    type: 'identity',
    status: 'approved',
    verifiedAt: new Date('2027-01-10T00:00:00Z'),
    expiresAt: new Date('2028-01-10T00:00:00Z'),
  };
}

function candidate(id: string, overrides: Partial<MatchCandidate> = {}): MatchCandidate {
  const specialistId = asId<SpecialistId>(id);
  return {
    specialistId,
    name: `Specialist ${id}`,
    category: 'design',
    skills: ['Product design', 'Figma', 'Design systems'],
    availability: 'available_now',
    location: 'Lagos, Nigeria',
    yearsExperience: 7,
    rateMinKobo: asKobo(22000000),
    rateMaxKobo: asKobo(28000000),
    profileStatus: 'approved',
    verifications: [verification(specialistId)],
    hasConflict: false,
    isBlocked: false,
    ...overrides,
  };
}

function input(overrides: Partial<ShortlistInput> = {}): ShortlistInput {
  return {
    requestId,
    request,
    candidates: [],
    now,
    ...overrides,
  };
}

describe('matching rules', () => {
  it('excludes blocked, conflicting, excluded and undiscoverable specialists', () => {
    const excludedId = asId<SpecialistId>('specialist-fake-excluded');
    const shortlist = buildShortlist(
      input({
        candidates: [
          candidate('specialist-fake-good'),
          candidate('specialist-fake-conflict', { hasConflict: true }),
          candidate('specialist-fake-blocked', { isBlocked: true }),
          candidate(excludedId),
          candidate('specialist-fake-pending', { profileStatus: 'pending' }),
          candidate('specialist-fake-suspended', { profileStatus: 'suspended' }),
          candidate('specialist-fake-unverified', { verifications: [] }),
          candidate('specialist-fake-expired', {
            verifications: [
              {
                ...verification(asId<SpecialistId>('specialist-fake-expired')),
                expiresAt: new Date('2026-01-10T00:00:00Z'),
              },
            ],
          }),
        ],
        excludedSpecialistIds: [excludedId],
      }),
    );

    expect(shortlist).toHaveLength(1);
    expect(shortlist[0]?.specialistId).toBe('specialist-fake-good');
  });

  it('produces deterministic scores and two to three explainable reasons', () => {
    const shortlist = buildShortlist(
      input({
        candidates: [candidate('specialist-fake-zulu'), candidate('specialist-fake-alpha')],
      }),
    );

    expect(shortlist.map((match) => match.specialistId)).toEqual([
      'specialist-fake-alpha',
      'specialist-fake-zulu',
    ]);
    expect(shortlist[0]?.score).toBe(100);
    expect(shortlist[0]?.reasons).toHaveLength(3);
    expect(shortlist[0]?.reasons.map((reason) => reason.code)).toEqual([
      'must_have_skills',
      'category_fit',
      'verification',
    ]);
    expect(shortlist[0]?.reasons.map((reason) => reason.message)).toContain('Identity verified');
    expect(scoreCandidate(input(), candidate('specialist-fake-alpha')).score).toBe(100);
  });

  it('does not permit confirmation until the specialist opts in', () => {
    const match = scoreCandidate(input(), candidate('specialist-fake-001'));

    expect(() => confirmMatch(match, actorId, now)).toThrow(ValidationError);
    expect(recordMatchOptIn(match, actorId, now).event.to).toBe('opted_in');
    expect(confirmMatch({ ...match, stage: 'opted_in' }, actorId, now).event.to).toBe('confirmed');
    expect(() => declineMatch({ ...match, stage: 'confirmed' }, actorId, now)).toThrow(
      InvalidTransitionError,
    );
  });

  it('never ranks on payment or exposure data', () => {
    const match = scoreCandidate(input(), candidate('specialist-fake-001'));

    expect(match.scoreBreakdown.every((factor) => factor.maxPoints <= 25)).toBe(true);
    expect(JSON.stringify(match)).not.toContain('paid');
    expect(JSON.stringify(match)).not.toContain('sponsored');
  });
});
