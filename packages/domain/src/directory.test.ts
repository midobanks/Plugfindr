import { describe, expect, it } from 'vitest';
import { toPublicSpecialist } from './directory';
import type { DirectorySource } from './directory';
import { asId, asKobo } from './ids';
import type { SpecialistId, VerificationId } from './ids';
import type { VerificationRecord } from './invariants';

const now = new Date('2027-03-12T00:00:00Z');
const specialistId = asId<SpecialistId>('specialist-fake-001');

function verification(overrides: Partial<VerificationRecord> = {}): VerificationRecord {
  return {
    id: asId<VerificationId>('verification-fake-001'),
    specialistId,
    type: 'identity',
    status: 'approved',
    verifiedAt: new Date('2027-01-10T00:00:00Z'),
    expiresAt: new Date('2028-01-10T00:00:00Z'),
    ...overrides,
  };
}

function source(overrides: Partial<DirectorySource> = {}): DirectorySource {
  return {
    specialistId,
    name: 'Chidi Okoro',
    headline: 'Product designer for fintech and marketplace teams',
    category: 'design',
    skills: ['Product design', 'Figma', 'Design systems'],
    location: 'Lagos, Nigeria',
    availability: 'available_now',
    yearsExperience: 7,
    rateFromKobo: asKobo(25000000),
    profileStatus: 'approved',
    verifications: [verification()],
    ...overrides,
  };
}

describe('public directory rules', () => {
  it('publishes an approved specialist with only current badges', () => {
    const result = toPublicSpecialist(
      source({
        verifications: [
          verification(),
          verification({
            id: asId<VerificationId>('verification-fake-002'),
            type: 'portfolio',
          }),
          verification({
            id: asId<VerificationId>('verification-fake-003'),
            type: 'contact',
            status: 'approved',
            verifiedAt: new Date('2025-01-10T00:00:00Z'),
            expiresAt: new Date('2026-01-10T00:00:00Z'),
          }),
        ],
      }),
      now,
    );

    expect(result?.badges.map((badge) => badge.type)).toEqual(['identity', 'portfolio']);
    expect(result?.rateFromKobo).toBe(25000000);
  });

  it('hides pending, suspended and unverified profiles', () => {
    expect(toPublicSpecialist(source({ profileStatus: 'pending' }), now)).toBeNull();
    expect(toPublicSpecialist(source({ profileStatus: 'suspended' }), now)).toBeNull();
    expect(toPublicSpecialist(source({ verifications: [] }), now)).toBeNull();
    expect(
      toPublicSpecialist(
        source({
          verifications: [verification({ expiresAt: new Date('2026-01-10T00:00:00Z') })],
        }),
        now,
      ),
    ).toBeNull();
  });
});
