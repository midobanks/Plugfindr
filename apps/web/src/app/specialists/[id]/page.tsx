import type { JSX } from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { VerificationType } from '@plugfindr/domain';
import { enNG } from '../../../i18n/messages/en-NG';
import { formatRate } from '../../../lib/discovery/format';
import { getSearchService } from '../../../lib/discovery/runtime';

export const metadata: Metadata = {
  title: enNG.discovery.viewProfile,
};

export default async function SpecialistProfilePage({
  params,
}: {
  readonly params: Promise<{ readonly id: string }>;
}): Promise<JSX.Element> {
  const { id } = await params;
  const service = getSearchService();
  const results = service === null ? [] : await service.search('');
  const specialist = results.find((item) => item.specialistId === id);

  if (specialist === undefined) notFound();

  return (
    <>
      <section className="band-dark request-band" aria-labelledby="profile-heading">
        <div className="shell">
          <p className="eyebrow">{enNG.brand.name}</p>
          <h1 id="profile-heading">{specialist.name}</h1>
          <p className="page-support">{specialist.headline}</p>
        </div>
      </section>

      <section className="band-light section" aria-label={enNG.discovery.viewProfile}>
        <div className="shell">
          <div className="profile-panel">
            <dl className="profile-facts">
              <div>
                <dt>{enNG.discovery.categoryLabel}</dt>
                <dd>
                  {specialist.category === null
                    ? enNG.discovery.allCategories
                    : enNG.request.categories[specialist.category]}
                </dd>
              </div>
              <div>
                <dt>{enNG.discovery.locationLabel}</dt>
                <dd>{specialist.location ?? enNG.discovery.profileUnavailable}</dd>
              </div>
              <div>
                <dt>{enNG.discovery.availableOnly}</dt>
                <dd>
                  {specialist.availability === 'available_now'
                    ? enNG.discovery.availableOnly
                    : enNG.discovery.profileUnavailable}
                </dd>
              </div>
              <div>
                <dt>{enNG.discovery.resultsLabel}</dt>
                <dd>{formatRate(specialist.rateFromKobo)}</dd>
              </div>
            </dl>
            <div className="skill-row" aria-label={enNG.request.fields.mustHave}>
              {specialist.skills.map((skill) => (
                <span className="skill-pill" key={skill}>
                  {skill}
                </span>
              ))}
            </div>
            {specialist.badges.length > 0 ? (
              <div className="badge-row" aria-label={enNG.discovery.trustLink}>
                {specialist.badges.map((badge) => (
                  <Link
                    className="badge-pill"
                    href={`/trust#${badge.type}`}
                    key={`${badge.type}-${badge.verifiedAt.toISOString()}`}
                  >
                    {enNG.discovery.badges[badge.type as VerificationType]}
                  </Link>
                ))}
              </div>
            ) : null}
            <Link className="text-link" href="/trust">
              {enNG.discovery.trustLink}
            </Link>
          </div>
        </div>
      </section>

      <section className="band-soft section" aria-label={enNG.request.cta}>
        <div className="shell cta-band">
          <h2>{enNG.request.empty.title}</h2>
          <p>{enNG.request.empty.support}</p>
          <Link className="primary-button" href="/request">
            {enNG.request.cta}
          </Link>
        </div>
      </section>
    </>
  );
}
