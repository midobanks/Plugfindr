import type { JSX } from 'react';
import Link from 'next/link';
import { enNG } from '../i18n/messages/en-NG';

export default function SiteHeader(): JSX.Element {
  return (
    <header className="site-header">
      <div className="shell site-header-inner">
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
          <Link className="nav-link" href="/#how-it-works">
            {enNG.nav.howItWorks}
          </Link>
          <Link className="nav-link" href="/about">
            {enNG.nav.about}
          </Link>
          <Link className="nav-link" href="/join">
            {enNG.nav.join}
          </Link>
          <Link className="nav-cta" href="/request">
            {enNG.request.cta}
          </Link>
        </nav>
      </div>
    </header>
  );
}
