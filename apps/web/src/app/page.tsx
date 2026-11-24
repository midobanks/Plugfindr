import type { JSX } from 'react';
import Link from 'next/link';
import { enNG } from '../i18n/messages/en-NG';

export default function HomePage(): JSX.Element {
  const { hero, steps, trust } = enNG.home;

  return (
    <>
      <section className="band-dark hero-band" aria-labelledby="hero-heading">
        <div className="shell hero">
          <div>
            <p className="eyebrow">{hero.eyebrow}</p>
            <h1 id="hero-heading">{hero.heading}</h1>
            <p className="hero-support">{hero.support}</p>
            <div className="hero-actions">
              <Link className="primary-button" href="/request">
                {enNG.request.cta}
              </Link>
              <Link className="text-link" href="/about">
                {enNG.nav.about}
              </Link>
            </div>
            <p className="hero-support">{hero.note}</p>
          </div>
          <div className="hero-visual">
            <svg className="network" viewBox="0 0 520 420" role="img" aria-label={hero.visualLabel}>
              <line x1="260" y1="210" x2="96" y2="92" />
              <line x1="260" y1="210" x2="424" y2="108" />
              <line x1="260" y1="210" x2="112" y2="326" />
              <line x1="260" y1="210" x2="412" y2="318" />
              <line x1="96" y1="92" x2="424" y2="108" />
              <line x1="112" y1="326" x2="412" y2="318" />
              <line x1="96" y1="92" x2="112" y2="326" />
              <line x1="424" y1="108" x2="412" y2="318" />
              <circle className="node" cx="260" cy="210" r="34" />
              <circle className="node" cx="96" cy="92" r="18" />
              <circle className="node" cx="424" cy="108" r="18" />
              <circle className="node" cx="112" cy="326" r="18" />
              <circle className="node" cx="412" cy="318" r="18" />
              <circle className="spark" cx="260" cy="210" r="6" />
              <text x="260" y="216" textAnchor="middle">
                PF
              </text>
              <text x="96" y="132" textAnchor="middle">
                DESIGN
              </text>
              <text x="424" y="148" textAnchor="middle">
                TECH
              </text>
              <text x="112" y="366" textAnchor="middle">
                GROWTH
              </text>
              <text x="412" y="358" textAnchor="middle">
                OPS
              </text>
            </svg>
          </div>
        </div>
      </section>

      <section className="band-light section" id="how-it-works" aria-labelledby="steps-heading">
        <div className="shell">
          <h2 className="section-heading" id="steps-heading">
            {steps.title}
          </h2>
          <div className="steps-grid">
            {steps.items.map((item) => (
              <article className="step-card" key={item.index}>
                <span className="step-index">{item.index}</span>
                <h2>{item.title}</h2>
                <p>{item.body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="band-dark section" aria-labelledby="trust-heading">
        <div className="shell trust-grid">
          <div>
            <h2 className="section-heading" id="trust-heading">
              {trust.title}
            </h2>
            <p className="trust-body">{trust.body}</p>
            <ul className="trust-points">
              {trust.points.map((point) => (
                <li key={point}>{point}</li>
              ))}
            </ul>
          </div>
          <div className="trust-aside">
            <p>{trust.aside}</p>
          </div>
        </div>
      </section>

      <section className="band-soft section" aria-labelledby="empty-state-heading">
        <div className="shell">
          <div className="empty-state">
            <div>
              <h2 id="empty-state-heading">{enNG.request.empty.title}</h2>
              <p>{enNG.request.empty.support}</p>
            </div>
            <Link className="secondary-button" href="/request">
              {enNG.request.cta}
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
