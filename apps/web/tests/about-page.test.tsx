import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import AboutPage from '../src/app/about/page';
import { enNG } from '../src/i18n/messages/en-NG';

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#x27;');
}

describe('about page', () => {
  it('renders the approved story verbatim from the i18n layer', () => {
    const html = renderToStaticMarkup(createElement(AboutPage));
    const { story } = enNG.about;
    const suppliedLines = [story.prompt, story.question, ...story.paragraphs, story.signoff];

    expect(suppliedLines).toHaveLength(8);
    for (const line of suppliedLines) {
      expect(html).toContain(escapeHtml(line));
    }
  });

  it('keeps the question on its own line and the sign-off last', () => {
    const html = renderToStaticMarkup(createElement(AboutPage));
    const questionIndex = html.indexOf(escapeHtml(enNG.about.story.question));
    const signoffIndex = html.indexOf(escapeHtml(enNG.about.story.signoff));

    expect(html).toContain('<blockquote');
    expect(questionIndex).toBeGreaterThan(-1);
    expect(signoffIndex).toBeGreaterThan(questionIndex);
  });
});
