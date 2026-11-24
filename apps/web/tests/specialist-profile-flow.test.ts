import { FakeRateLimiter, FakeSpecialistProfileStore } from '@plugfindr/adapters';
import { asId, RateLimitError, ServiceUnavailableError, ValidationError } from '@plugfindr/domain';
import type { SpecialistId } from '@plugfindr/domain';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import JoinPage from '../src/app/join/page';
import { enNG } from '../src/i18n/messages/en-NG';
import { parseSpecialistProfile } from '../src/lib/specialists/schema';
import { submitSpecialistProfile } from '../src/lib/specialists/submit';

const now = new Date('2027-03-12T00:00:00Z');
const specialistId = asId<SpecialistId>('specialist-fake-001');

const validPayload = {
  name: 'Chidi Okoro',
  headline: 'Product designer for fintech and marketplace teams',
  category: 'design',
  skills: ['Product design', 'Figma', 'Design systems'],
  bio: 'I design calm, usable products for teams building money and marketplace experiences in Africa.',
  yearsExperience: 7,
  location: 'Lagos, Nigeria',
  timeZone: 'Africa/Lagos',
  languages: ['English', 'Igbo'],
  availability: 'available_now',
  engagementTypes: ['project', 'retainer'],
  rateVisibility: 'range',
  rateMinKobo: 25000000,
  rateMaxKobo: 40000000,
  hideEmployer: true,
};

describe('specialist profile flow', () => {
  it('parses a valid profile payload', () => {
    const profile = parseSpecialistProfile(validPayload);
    expect(profile.category).toBe('design');
    expect(profile.skills).toHaveLength(3);
    expect(profile.rateMinKobo).toBe(25000000);
  });

  it('rejects invalid boundary data', () => {
    expect(() => parseSpecialistProfile({ ...validPayload, category: 'unknown' })).toThrow(
      ValidationError,
    );
    expect(() => parseSpecialistProfile({ ...validPayload, skills: ['Figma'] })).toThrow(
      ValidationError,
    );
  });

  it('submits as pending through the ports', async () => {
    const store = new FakeSpecialistProfileStore();
    const limiter = new FakeRateLimiter(2, 60_000);
    const profile = parseSpecialistProfile(validPayload);
    const receipt = await submitSpecialistProfile({
      store,
      limiter,
      specialistId,
      profile,
      completeness: 100,
      now,
    });

    expect(receipt.status).toBe('pending');
    expect(await store.get(specialistId)).toEqual(receipt);
  });

  it('blocks rate-limited and unavailable submissions', async () => {
    const store = new FakeSpecialistProfileStore();
    const limiter = new FakeRateLimiter(1, 60_000);
    const profile = parseSpecialistProfile(validPayload);

    await submitSpecialistProfile({
      store,
      limiter,
      specialistId,
      profile,
      completeness: 100,
      now,
    });
    await expect(
      submitSpecialistProfile({
        store,
        limiter,
        specialistId,
        profile,
        completeness: 100,
        now,
      }),
    ).rejects.toThrow(RateLimitError);
    await expect(
      submitSpecialistProfile({
        store: null,
        limiter,
        specialistId,
        profile,
        completeness: 100,
        now,
      }),
    ).rejects.toThrow(ServiceUnavailableError);
  });

  it('renders the first step and the privacy note', () => {
    const html = renderToStaticMarkup(createElement(JoinPage));
    expect(html).toContain(enNG.specialist.title);
    expect(html).toContain(enNG.specialist.fields.name);
    expect(html).toContain(enNG.specialist.fields.headline);
    expect(html).toContain(enNG.specialist.steps.next);
    expect(html).toContain(enNG.specialist.aside.title);
  });
});
