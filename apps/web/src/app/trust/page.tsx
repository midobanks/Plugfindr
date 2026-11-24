import type { JSX } from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import type { VerificationType } from '@plugfindr/domain';
import { enNG } from '../../i18n/messages/en-NG';

const badgeTypes: readonly VerificationType[] = [
  'identity',
  'contact',
  'portfolio',
  'credentials',
  'reference',
  'skill',
  'proven',
  'business',
];

export const metadata: Metadata = {
  title: enNG.trust.title,
  description: enNG.trust.intro,
};

export default function TrustPage(): JSX.Element {
  return (
    <>
      <section className="band-dark request-band" aria-labelledby="trust-heading">
        <div className="shell">
          <p className="eyebrow">{enNG.brand.name}</p>
          <h1 id="trust-heading">{enNG.trust.title}</h1>
          <p className="page-support">{enNG.trust.intro}</p>
        </div>
      </section>

      <section className="band-light section" aria-label={enNG.trust.title}>
        <div className="shell">
          <div className="trust-explainer-grid">
            {enNG.trust.items.map((item, index) => (
              <article className="trust-card" id={badgeTypes[index]} key={item.title}>
                <h2>{item.title}</h2>
                <p>{item.body}</p>
              </article>
            ))}
          </div>
          <p className="trust-footnote">{enNG.brand.signoff}</p>
          <Link className="secondary-button" href="/specialists">
            {enNG.nav.browse}
          </Link>
        </div>
      </section>
    </>
  );
}
