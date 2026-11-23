import { describe, expect, it } from 'vitest';
import { ValidationError } from './errors';
import { asId, asKobo } from './ids';
import type { SpecialistId, VerificationId } from './ids';
import {
  canRevealContact,
  deriveBadges,
  isSpecialistDiscoverable,
  validateMatchReasons,
} from './invariants';
import type { VerificationRecord } from './invariants';

const specialistId = asId<SpecialistId>('specialist-001');
const now = new Date('2027-03-12T00:00:00Z');

function verification(overrides: Partial<VerificationRecord> = {}): VerificationRecord {
  return {
    id: asId<VerificationId>('ver-001'),
    specialistId,
    type: 'identity',
    status: 'approved',
    verifiedAt: new Date('2027-01-05T00:00:00Z'),
    expiresAt: new Date('2028-01-05T00:00:00Z'),
    ...overrides,
  };
}

describe('badge derivation', () => {
  it('includes a current approved verification', () => {
    const badges = deriveBadges([verification()], now);
    expect(badges).toHaveLength(1);
    expect(badges[0]?.type).toBe('identity');
  });

  it('drops a badge at expiry', () => {
    const badges = deriveBadges([verification({ expiresAt: now })], now);
    expect(badges).toHaveLength(0);
  });

  it('drops badges that are not approved or have no verification date', () => {
    const rejected = verification({ status: 'rejected' });
    const unverified = verification({ verifiedAt: null });
    expect(deriveBadges([rejected, unverified], now)).toHaveLength(0);
  });
});

describe('specialist discoverability', () => {
  it('hides a pending profile even with a current verification', () => {
    expect(isSpecialistDiscoverable('pending', [verification()], now)).toBe(false);
  });

  it('shows an approved profile with a current identity verification', () => {
    expect(isSpecialistDiscoverable('approved', [verification()], now)).toBe(true);
  });

  it('hides an approved profile when the identity verification has expired', () => {
    expect(
      isSpecialistDiscoverable(
        'approved',
        [verification({ expiresAt: new Date('2027-01-06T00:00:00Z') })],
        now,
      ),
    ).toBe(false);
  });

  it('hides an approved profile whose only verification is contact', () => {
    expect(isSpecialistDiscoverable('approved', [verification({ type: 'contact' })], now)).toBe(
      false,
    );
  });

  it('respects a custom required verification set', () => {
    expect(
      isSpecialistDiscoverable('approved', [verification({ type: 'contact' })], now, ['contact']),
    ).toBe(true);
  });
});

describe('contact masking', () => {
  it('stays masked during an unaccepted introduction', () => {
    expect(canRevealContact('requested', true, false)).toBe(false);
  });

  it('stays masked after acceptance until the specialist shares contact', () => {
    expect(canRevealContact('accepted', false, false)).toBe(false);
    expect(canRevealContact('accepted', true, false)).toBe(true);
  });

  it('reveals contact once the engagement is confirmed', () => {
    expect(canRevealContact('declined', false, true)).toBe(true);
  });
});

describe('match reasons', () => {
  it('accepts two or three reasons', () => {
    expect(validateMatchReasons(['Fintech experience', 'Available now'])).toHaveLength(2);
    expect(
      validateMatchReasons(['Fintech experience', 'Available now', 'Identity verified']),
    ).toHaveLength(3);
  });

  it('rejects fewer than two or more than three reasons', () => {
    expect(() => validateMatchReasons(['Only one'])).toThrow(ValidationError);
    expect(() => validateMatchReasons(['a', 'b', 'c', 'd'])).toThrow(ValidationError);
  });

  it('rejects a blank reason', () => {
    expect(() => validateMatchReasons(['Valid reason', '   '])).toThrow(ValidationError);
  });
});

describe('money', () => {
  it('accepts whole kobo amounts', () => {
    expect(asKobo(25000000)).toBe(25000000);
  });

  it('rejects negative and fractional amounts', () => {
    expect(() => asKobo(-1)).toThrow(ValidationError);
    expect(() => asKobo(1.5)).toThrow(ValidationError);
  });
});
