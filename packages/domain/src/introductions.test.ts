import { describe, expect, it } from 'vitest';
import {
  acceptIntroduction,
  canRevealIntroductionContact,
  createIntroduction,
  declineIntroduction,
  expireIntroduction,
  toIntroductionView,
} from './introductions';
import type { ContactDetails, CreateIntroductionInput } from './introductions';
import { asId } from './ids';
import type { BusinessId, MatchId, RequestId, SpecialistId } from './ids';
import type { Match } from './matching';
import { AuthorizationError, ValidationError } from './errors';

const now = new Date('2027-03-12T00:00:00Z');
const specialistId = asId<SpecialistId>('specialist-fake-001');
const businessId = asId<BusinessId>('business-fake-001');
const matchId = asId<MatchId>('match-fake-001');

const match: Match = {
  matchId,
  requestId: asId<RequestId>('request-fake-001'),
  specialistId,
  score: 88,
  stage: 'proposed',
  reasons: [],
  scoreBreakdown: [],
};

const contact: ContactDetails = {
  email: 'specialist.fake@example.test',
  phone: '+234 000 000 0000',
  whatsapp: '+234 000 000 0001',
};

function input(overrides: Partial<CreateIntroductionInput> = {}): CreateIntroductionInput {
  return {
    match,
    businessId,
    briefSummary: 'We need a product designer to refresh our fintech onboarding flow.',
    budgetSummary: '₦200,000 to ₦300,000',
    timeline: 'From March 2027',
    hasConflict: false,
    isBlocked: false,
    now,
    ...overrides,
  };
}

describe('introduction rules', () => {
  it('rejects closed, conflicting and blocked introductions', () => {
    expect(() => createIntroduction(input({ hasConflict: true }))).toThrow(ValidationError);
    expect(() => createIntroduction(input({ isBlocked: true }))).toThrow(ValidationError);
    expect(() => createIntroduction(input({ match: { ...match, stage: 'declined' } }))).toThrow(
      ValidationError,
    );
  });

  it('sets a 48-hour response window and opens a thread on acceptance', () => {
    const introduction = createIntroduction(input());

    expect(introduction.state).toBe('requested');
    expect(introduction.responseDueAt.getTime() - now.getTime()).toBe(48 * 60 * 60 * 1000);
    const accepted = acceptIntroduction(introduction, specialistId, now);
    expect(accepted.transition.event.to).toBe('accepted');
    expect(accepted.conversationThreadId).toBe(`intro-thread:${introduction.id}`);
    expect(declineIntroduction(introduction, 'Not the right fit', specialistId, now).event.to).toBe(
      'declined',
    );
    expect(
      expireIntroduction(introduction, businessId, new Date(now.getTime() + 49 * 60 * 60 * 1000))
        .event.to,
    ).toBe('expired');
  });

  it('allows only the specialist to respond to an introduction', () => {
    const introduction = createIntroduction(input());

    expect(() => acceptIntroduction(introduction, businessId, now)).toThrow(AuthorizationError);
    expect(() => declineIntroduction(introduction, 'Not the right fit', businessId, now)).toThrow(
      AuthorizationError,
    );
  });

  it('masks contact details until the specialist shares or an engagement is hired', () => {
    const introduction = createIntroduction(input());

    const hidden = toIntroductionView(introduction, contact, {
      specialistShared: false,
      engagementState: 'in_discussion',
    });
    expect(hidden.contact).toEqual({
      email: 'Hidden until shared',
      phone: 'Hidden until shared',
      whatsapp: 'Hidden until shared',
    });
    expect(JSON.stringify(hidden)).not.toContain(contact.email);
    expect(JSON.stringify(hidden)).not.toContain(contact.phone);

    expect(
      canRevealIntroductionContact({ specialistShared: false, engagementState: 'hired' }),
    ).toBe(true);
    expect(canRevealIntroductionContact({ specialistShared: true, engagementState: null })).toBe(
      true,
    );
    expect(
      canRevealIntroductionContact({ specialistShared: false, engagementState: 'completed' }),
    ).toBe(true);
    expect(
      canRevealIntroductionContact({ specialistShared: false, engagementState: 'not_proceeding' }),
    ).toBe(false);

    const shared = toIntroductionView(introduction, contact, {
      specialistShared: true,
      engagementState: null,
    });
    expect(shared.contact.email).toBe(contact.email);
  });
});
