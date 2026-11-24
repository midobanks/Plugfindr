import type { JSX } from 'react';
import type { Metadata } from 'next';
import SpecialistProfileForm from '../../components/SpecialistProfileForm';
import { enNG } from '../../i18n/messages/en-NG';

export const metadata: Metadata = {
  title: enNG.specialist.title,
  description: enNG.specialist.intro,
};

export default function JoinPage(): JSX.Element {
  return (
    <>
      <section className="band-dark request-band" aria-labelledby="join-heading">
        <div className="shell">
          <p className="eyebrow">{enNG.brand.name}</p>
          <h1 id="join-heading">{enNG.specialist.title}</h1>
          <p className="page-support">{enNG.specialist.intro}</p>
        </div>
      </section>
      <section className="request-page band-light" aria-label={enNG.specialist.title}>
        <div className="shell request-layout">
          <div className="request-card">
            <SpecialistProfileForm />
          </div>
          <aside className="request-aside">
            <h2>{enNG.specialist.aside.title}</h2>
            <p>{enNG.specialist.aside.body}</p>
          </aside>
        </div>
      </section>
    </>
  );
}
