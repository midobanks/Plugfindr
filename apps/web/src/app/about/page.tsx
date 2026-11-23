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
    <article className="story" aria-labelledby="about-heading">
      <h1 id="about-heading">{enNG.about.title}</h1>
      <p className="story-prompt">{story.prompt}</p>
      <blockquote className="story-question">{story.question}</blockquote>
      {story.paragraphs.map((paragraph) => (
        <p key={paragraph}>{paragraph}</p>
      ))}
      <p className="story-signoff">{story.signoff}</p>
    </article>
  );
}
