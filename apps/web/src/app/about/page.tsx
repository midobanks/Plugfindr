import type { JSX } from 'react';
import type { Metadata } from 'next';
import { enNG } from '../../i18n/messages/en-NG';

export const metadata: Metadata = {
  title: enNG.about.title,
  description: enNG.about.story.prompt,
};

export default function AboutPage(): JSX.Element {
  const { story } = enNG.about;

  return (
    <article aria-labelledby="about-heading">
      <section className="band-dark story-band">
        <div className="shell">
          <p className="eyebrow">{enNG.brand.name}</p>
          <h1 id="about-heading">{enNG.about.title}</h1>
        </div>
      </section>
      <div className="band-soft">
        <div className="story">
          <p className="story-prompt">{story.prompt}</p>
          <blockquote className="story-question">{story.question}</blockquote>
          {story.paragraphs.map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
          <p className="story-signoff">{story.signoff}</p>
        </div>
      </div>
    </article>
  );
}
