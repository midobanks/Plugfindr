import type { JSX } from 'react';
import Link from 'next/link';
import { enNG } from '../i18n/messages/en-NG';

export default function HomePage(): JSX.Element {
  return (
    <section className="hero" aria-labelledby="hero-heading">
      <p className="eyebrow">{enNG.brand.name}</p>
      <h1 id="hero-heading">{enNG.home.hero.heading}</h1>
      <p className="hero-support">{enNG.home.hero.support}</p>
      <Link className="text-link" href="/about">
        {enNG.nav.about}
      </Link>
    </section>
  );
}
