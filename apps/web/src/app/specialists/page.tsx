import type { JSX } from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import type { PublicSpecialistDocument, SearchFilters } from '@plugfindr/adapters';
import { SPECIALIST_CATEGORIES } from '@plugfindr/domain';
import type { VerificationType } from '@plugfindr/domain';
import { enNG } from '../../i18n/messages/en-NG';
import { formatRate } from '../../lib/discovery/format';
import { getSearchService } from '../../lib/discovery/runtime';

export const metadata: Metadata = {
  title: enNG.discovery.title,
  description: enNG.discovery.intro,
};

type SearchParams = Record<string, string | string[] | undefined>;

function firstValue(value: string | string[] | undefined): string {
  return Array.isArray(value) ? (value[0] ?? '') : (value ?? '');
}

function ResultCard({
  specialist,
}: {
  readonly specialist: PublicSpecialistDocument;
}): JSX.Element {
  return (
    <article className="result-card">
      <div className="result-top">
        <p className="result-eyebrow">
          {specialist.category === null
            ? enNG.discovery.resultsLabel
            : enNG.request.categories[specialist.category]}
        </p>
        <p className="result-name">{specialist.name}</p>
        <h2 className="result-headline">{specialist.headline}</h2>
      </div>
      <div className="skill-row" aria-label={enNG.request.fields.mustHave}>
        {specialist.skills.slice(0, 4).map((skill) => (
          <span className="skill-pill" key={skill}>
            {skill}
          </span>
        ))}
      </div>
      <p className="result-meta">
        {specialist.location ?? enNG.discovery.resultsLabel}
        {' · '}
        {formatRate(specialist.rateFromKobo)}
        {specialist.yearsExperience === null
          ? ''
          : ` · ${enNG.discovery.yearsExperience.replace('{value}', String(specialist.yearsExperience))}`}
      </p>
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
      <div className="result-actions">
        <Link className="primary-button" href="/request">
          {enNG.request.cta}
        </Link>
        <Link className="text-link" href={`/specialists/${specialist.specialistId}`}>
          {enNG.discovery.viewProfile}
        </Link>
      </div>
    </article>
  );
}

export default async function SpecialistsPage({
  searchParams,
}: {
  readonly searchParams: Promise<SearchParams>;
}): Promise<JSX.Element> {
  const params = await searchParams;
  const query = firstValue(params['q']);
  const location = firstValue(params['location']);
  const available = firstValue(params['available']) === 'on';
  const rawCategory = firstValue(params['category']);
  const category = SPECIALIST_CATEGORIES.find((value) => value === rawCategory) ?? '';
  const filters: SearchFilters = {
    ...(category === '' ? {} : { category }),
    ...(available ? { availableOnly: true } : {}),
    ...(location.trim().length === 0 ? {} : { location: location.trim() }),
  };

  const service = getSearchService();
  const results = service === null ? [] : await service.search(query, filters);

  return (
    <>
      <section className="band-dark request-band" aria-labelledby="discovery-heading">
        <div className="shell">
          <p className="eyebrow">{enNG.brand.name}</p>
          <h1 id="discovery-heading">{enNG.discovery.title}</h1>
          <p className="page-support">{enNG.discovery.intro}</p>
        </div>
      </section>

      <section className="band-light section" aria-label={enNG.discovery.searchLabel}>
        <div className="shell">
          <form className="search-panel" method="get" action="/specialists">
            <div className="search-grid">
              <div>
                <label htmlFor="discovery-query">{enNG.discovery.searchLabel}</label>
                <input
                  id="discovery-query"
                  name="q"
                  type="search"
                  placeholder={enNG.discovery.searchPlaceholder}
                  defaultValue={query}
                />
              </div>
              <div>
                <label htmlFor="discovery-location">{enNG.discovery.locationLabel}</label>
                <input
                  id="discovery-location"
                  name="location"
                  placeholder={enNG.discovery.locationPlaceholder}
                  defaultValue={location}
                />
              </div>
              <div>
                <label htmlFor="discovery-category">{enNG.discovery.categoryLabel}</label>
                <select id="discovery-category" name="category" defaultValue={category}>
                  <option value="">{enNG.discovery.allCategories}</option>
                  {SPECIALIST_CATEGORIES.map((value) => (
                    <option key={value} value={value}>
                      {enNG.request.categories[value]}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <label className="checkbox-label" htmlFor="discovery-available">
              <input
                id="discovery-available"
                name="available"
                type="checkbox"
                defaultChecked={available}
              />
              {enNG.discovery.availableOnly}
            </label>
            <div className="form-actions">
              <button className="primary-button" type="submit">
                {enNG.discovery.submit}
              </button>
            </div>
          </form>

          <div className="category-row" aria-label={enNG.discovery.categoryLabel}>
            <Link className="category-pill" href="/specialists">
              {enNG.discovery.allCategories}
            </Link>
            {SPECIALIST_CATEGORIES.map((value) => (
              <Link className="category-pill" href={`/specialists?category=${value}`} key={value}>
                {enNG.request.categories[value]}
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="band-soft section" aria-label={enNG.discovery.resultsLabel}>
        <div className="shell">
          {results.length === 0 ? (
            <div className="empty-results">
              <h2>{enNG.discovery.emptyTitle}</h2>
              <p>{enNG.discovery.emptySupport}</p>
              <Link className="secondary-button" href="/request">
                {enNG.discovery.emptyCta}
              </Link>
            </div>
          ) : (
            <div className="result-grid">
              {results.map((specialist) => (
                <ResultCard specialist={specialist} key={specialist.specialistId} />
              ))}
            </div>
          )}
        </div>
      </section>
    </>
  );
}
