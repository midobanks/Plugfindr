import type { JSX } from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { asId } from '@plugfindr/domain';
import type { RequestId } from '@plugfindr/domain';
import { enNG } from '../../../../i18n/messages/en-NG';
import { getMatchStore } from '../../../../lib/matches/runtime';

export const metadata: Metadata = {
  title: enNG.matches.title,
  description: enNG.matches.intro,
};

export default async function MatchesPage({
  params,
}: {
  readonly params: Promise<{ readonly id: string }>;
}): Promise<JSX.Element> {
  const { id } = await params;
  const store = getMatchStore();
  const matches = store === null ? [] : await store.getShortlist(asId<RequestId>(id));

  return (
    <>
      <section className="band-dark request-band" aria-labelledby="matches-heading">
        <div className="shell">
          <p className="eyebrow">{enNG.brand.name}</p>
          <h1 id="matches-heading">{enNG.matches.title}</h1>
          <p className="page-support">{enNG.matches.intro}</p>
        </div>
      </section>

      <section className="band-soft section" aria-label={enNG.matches.title}>
        <div className="shell">
          {matches.length === 0 ? (
            <div className="empty-results">
              <h2>{enNG.matches.emptyTitle}</h2>
              <p>{enNG.matches.emptySupport}</p>
              <Link className="secondary-button" href="/request">
                {enNG.matches.emptyCta}
              </Link>
            </div>
          ) : (
            <div className="result-grid">
              {matches.map((match) => (
                <article className="result-card" key={match.matchId}>
                  <div className="result-top">
                    <p className="result-eyebrow">
                      {enNG.matches.stages[match.stage]} · {match.score}
                    </p>
                    <p className="result-name">{enNG.matches.specialistLabel}</p>
                  </div>
                  <h2 className="result-headline">{enNG.matches.why}</h2>
                  <ul className="reason-list">
                    {match.reasons.map((reason) => (
                      <li key={reason.code}>{reason.message}</li>
                    ))}
                  </ul>
                  <Link className="text-link" href={`/specialists/${match.specialistId}`}>
                    {enNG.discovery.viewProfile}
                  </Link>
                </article>
              ))}
            </div>
          )}
        </div>
      </section>
    </>
  );
}
