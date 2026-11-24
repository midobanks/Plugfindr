import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import SpecialistsPage from '../src/app/specialists/page';
import TrustPage from '../src/app/trust/page';
import { enNG } from '../src/i18n/messages/en-NG';

describe('discovery pages', () => {
  it('shows the honest empty state until search is connected', async () => {
    const element = await SpecialistsPage({ searchParams: Promise.resolve({}) });
    const html = renderToStaticMarkup(element);

    expect(html).toContain(enNG.discovery.title);
    expect(html).toContain(enNG.discovery.emptyTitle);
    expect(html).not.toContain('Chidi Okoro');
  });

  it('explains each badge with plain-language copy', () => {
    const html = renderToStaticMarkup(createElement(TrustPage));

    expect(html).toContain(enNG.trust.title);
    expect(html).toContain(enNG.trust.items[0]?.body);
    expect(html).toContain('id="identity"');
  });
});
