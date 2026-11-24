import { FakeRateLimiter, FakeRequestStore } from '@plugfindr/adapters';
import { asId, RateLimitError, ServiceUnavailableError, ValidationError } from '@plugfindr/domain';
import type { UserId } from '@plugfindr/domain';
import { renderToStaticMarkup } from 'react-dom/server';
import { createElement } from 'react';
import { describe, expect, it } from 'vitest';
import HomePage from '../src/app/page';
import RequestPage from '../src/app/request/page';
import { enNG } from '../src/i18n/messages/en-NG';
import { parseRequestBrief } from '../src/lib/requests/schema';
import { submitRequest } from '../src/lib/requests/submit';

const now = new Date('2027-03-12T00:00:00Z');

function escapeHtml(value: string): string {
  return value.replaceAll('&', '&amp;').replaceAll("'", '&#x27;');
}

const validPayload = {
  brief: 'We need a product designer for a fintech onboarding flow in Lagos.',
  category: 'design',
  scopeType: 'one_off_project',
  timeline: 'Start in two weeks',
  budgetMinKobo: 25000000,
  budgetMaxKobo: 40000000,
  budgetIsFlexible: false,
  locationPreference: 'Remote',
  mustHaveSkills: ['UI design', 'Figma'],
  niceToHaveSkills: ['Fintech'],
  attachmentLinks: ['https://example.test/brief'],
};

describe('request flow', () => {
  it('parses a valid payload into a domain brief', () => {
    const brief = parseRequestBrief(validPayload);
    expect(brief.category).toBe('design');
    expect(brief.budgetMinKobo).toBe(25000000);
    expect(brief.mustHaveSkills).toEqual(['UI design', 'Figma']);
  });

  it('rejects invalid boundary data', () => {
    expect(() => parseRequestBrief({ ...validPayload, category: 'unknown' })).toThrow(
      ValidationError,
    );
    expect(() =>
      parseRequestBrief({ ...validPayload, attachmentLinks: ['http://example.test'] }),
    ).toThrow(ValidationError);
  });

  it('submits through the ports and returns an opaque receipt', async () => {
    const store = new FakeRequestStore();
    const limiter = new FakeRateLimiter(2, 60_000);
    const actorId = asId<UserId>('user-fake-001');
    const brief = parseRequestBrief(validPayload);

    const receipt = await submitRequest({ store, limiter, actorId, brief, now });
    expect(receipt.status).toBe('submitted');
    expect(store.created()).toHaveLength(1);
  });

  it('blocks rate-limited and unavailable submissions', async () => {
    const store = new FakeRequestStore();
    const limiter = new FakeRateLimiter(1, 60_000);
    const actorId = asId<UserId>('user-fake-001');
    const brief = parseRequestBrief(validPayload);

    await submitRequest({ store, limiter, actorId, brief, now });
    await expect(submitRequest({ store, limiter, actorId, brief, now })).rejects.toThrow(
      RateLimitError,
    );
    await expect(submitRequest({ store: null, limiter, actorId, brief, now })).rejects.toThrow(
      ServiceUnavailableError,
    );
  });

  it('renders the first step of the request form and the empty-state copy', () => {
    const html = renderToStaticMarkup(createElement(RequestPage));
    expect(html).toContain(enNG.request.title);
    expect(html).toContain(enNG.request.fields.category);
    expect(html).toContain(enNG.request.fields.brief);
    expect(html).toContain(enNG.request.steps.next);

    const homeHtml = renderToStaticMarkup(createElement(HomePage));
    expect(homeHtml).toContain(escapeHtml(enNG.request.empty.title));
    expect(homeHtml).toContain(enNG.home.steps.title);
    expect(homeHtml).toContain(enNG.home.trust.title);
    expect(homeHtml).toContain(enNG.request.cta);
  });
});
