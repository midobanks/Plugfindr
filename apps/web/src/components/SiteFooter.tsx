import type { JSX } from 'react';
import { enNG } from '../i18n/messages/en-NG';

export default function SiteFooter(): JSX.Element {
  return (
    <footer className="site-footer">
      <div className="shell site-footer-inner">
        <p className="footer-brand">{enNG.brand.name}</p>
        <p className="footer-signoff">{enNG.brand.signoff}</p>
      </div>
    </footer>
  );
}
