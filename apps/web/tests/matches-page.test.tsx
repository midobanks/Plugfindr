import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import MatchesPage from '../src/app/requests/[id]/matches/page';
import { enNG } from '../src/i18n/messages/en-NG';

describe('matches page', () => {
  it('shows an honest empty shortlist until matching is connected', async () => {
    const element = await MatchesPage({ params: Promise.resolve({ id: 'request-fake-001' }) });
    const html = renderToStaticMarkup(element);

    expect(html).toContain(enNG.matches.title);
    expect(html).toContain(enNG.matches.emptyTitle);
    expect(html).not.toContain(enNG.matches.why);
  });
});
