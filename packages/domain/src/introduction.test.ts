import { describe, expect, it } from 'vitest';
import { InvalidTransitionError } from './errors';
import { asId } from './ids';
import type { IntroductionId } from './ids';
import { transitionIntroduction } from './introduction';

const introductionId = asId<IntroductionId>('intro-001');
const specialistId = 'specialist-001';
const now = new Date('2027-03-12T00:00:00Z');

describe('introduction state machine', () => {
  it.each(['accepted', 'declined', 'expired'] as const)('allows requested to %s', (next) => {
    expect(transitionIntroduction('requested', next, introductionId, specialistId, now).state).toBe(
      next,
    );
  });

  it('rejects moving from accepted to declined', () => {
    expect(() =>
      transitionIntroduction('accepted', 'declined', introductionId, specialistId, now),
    ).toThrow(InvalidTransitionError);
  });

  it('rejects a response before the introduction is requested', () => {
    expect(() =>
      transitionIntroduction('expired', 'accepted', introductionId, specialistId, now),
    ).toThrow(InvalidTransitionError);
  });
});
