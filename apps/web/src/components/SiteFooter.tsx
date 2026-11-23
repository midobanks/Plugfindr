import type { JSX } from 'react';
import { enNG } from '../i18n/messages/en-NG';

export default function SiteFooter(): JSX.Element {
  return (
    <footer className="site-footer">
      <p className="footer-brand">{enNG.brand.name}</p>
      <p className="footer-signoff">{enNG.brand.signoff}</p>
    </footer>
  );
}
