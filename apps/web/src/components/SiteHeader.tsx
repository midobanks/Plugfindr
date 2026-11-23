import type { JSX } from 'react';
import Link from 'next/link';
import { enNG } from '../i18n/messages/en-NG';

export default function SiteHeader(): JSX.Element {
  return (
    <header className="site-header">
      <Link href="/" className="brand-link">
        <img
          className="logo logo-light"
          src="/brand/plugfindr-logo-light.svg"
          alt="Plugfindr"
          width={168}
          height={136}
        />
        <img
          className="logo logo-dark"
          src="/brand/plugfindr-logo-dark.svg"
          alt="Plugfindr"
          width={168}
          height={136}
        />
      </Link>
      <nav className="site-nav" aria-label={enNG.nav.primaryLabel}>
        <Link href="/about">{enNG.nav.about}</Link>
      </nav>
    </header>
  );
}
