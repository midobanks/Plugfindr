import type { JSX } from 'react';
import Link from 'next/link';
import { enNG } from '../i18n/messages/en-NG';

export default function HomePage(): JSX.Element {
  return (
    <section className="hero" aria-labelledby="hero-heading">
      <p className="eyebrow">{enNG.brand.name}</p>
      <h1 id="hero-heading">{enNG.home.hero.heading}</h1>
      <p className="hero-support">{enNG.home.hero.support}</p>
      <Link className="primary-button" href="/request">
        {enNG.request.cta}
      </Link>
      <section className="empty-state" aria-labelledby="empty-state-heading">
        <h2 id="empty-state-heading">{enNG.request.empty.title}</h2>
        <p>{enNG.request.empty.support}</p>
      </section>
      <Link className="text-link" href="/about">
        {enNG.nav.about}
      </Link>
    </section>
  );
}
