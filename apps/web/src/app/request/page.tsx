import type { JSX } from 'react';
import type { Metadata } from 'next';
import RequestForm from '../../components/RequestForm';
import { enNG } from '../../i18n/messages/en-NG';

export const metadata: Metadata = {
  title: enNG.request.title,
  description: enNG.request.intro,
};

export default function RequestPage(): JSX.Element {
  return (
    <>
      <section className="band-dark request-band" aria-labelledby="request-heading">
        <div className="shell">
          <p className="eyebrow">{enNG.brand.name}</p>
          <h1 id="request-heading">{enNG.request.title}</h1>
          <p className="page-support">{enNG.request.intro}</p>
        </div>
      </section>
      <section className="request-page band-light" aria-label={enNG.request.title}>
        <div className="shell request-layout">
          <div className="request-card">
            <RequestForm />
          </div>
          <aside className="request-aside">
            <h2>{enNG.request.aside.title}</h2>
            <p>{enNG.request.aside.body}</p>
          </aside>
        </div>
      </section>
    </>
  );
}
