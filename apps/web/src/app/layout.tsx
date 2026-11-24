import type { JSX, ReactNode } from 'react';
import type { Metadata } from 'next';
import SiteFooter from '../components/SiteFooter';
import SiteHeader from '../components/SiteHeader';
import { enNG } from '../i18n/messages/en-NG';
import './globals.css';

export const metadata: Metadata = {
  title: {
    default: `${enNG.brand.name} — ${enNG.brand.signoff}`,
    template: `%s | ${enNG.brand.name}`,
  },
  description: enNG.home.hero.support,
};

export default function RootLayout({ children }: { readonly children: ReactNode }): JSX.Element {
  return (
    <html lang="en-NG">
      <body>
        <a className="skip-link" href="#main">
          {enNG.nav.skip}
        </a>
        <SiteHeader />
        <main id="main" className="band-light">
          {children}
        </main>
        <SiteFooter />
      </body>
    </html>
  );
}
