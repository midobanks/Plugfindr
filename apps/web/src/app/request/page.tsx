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
    <section className="request-page" aria-labelledby="request-heading">
      <h1 id="request-heading">{enNG.request.title}</h1>
      <p className="page-support">{enNG.request.intro}</p>
      <RequestForm />
    </section>
  );
}
