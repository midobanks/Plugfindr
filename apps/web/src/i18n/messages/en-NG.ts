export const enNG = {
  brand: {
    name: 'Plugfindr',
    signoff: 'We know someone.',
  },
  nav: {
    skip: 'Skip to content',
    about: 'About Plugfindr',
    howItWorks: 'How it works',
    primaryLabel: 'Primary navigation',
  },
  home: {
    hero: {
      eyebrow: 'Specialist discovery, done plainly',
      heading: 'Looking for someone who can get it done? Find your plug.',
      support: 'The right specialist, without the endless search.',
      note: 'Shortlisted with care. Introduced with context.',
      visualLabel: 'A connected network of independent specialists',
    },
    steps: {
      title: 'From brief to introduction, without the noise.',
      items: [
        {
          index: '01',
          title: 'Tell us who you need',
          body: 'Describe the outcome, timing and budget in a few guided questions.',
        },
        {
          index: '02',
          title: 'Get a shortlist with context',
          body: 'We match your brief to specialists whose checks and experience fit.',
        },
        {
          index: '03',
          title: 'Meet the right plug',
          body: 'See why each person fits, then start the conversation.',
        },
      ],
    },
    trust: {
      title: 'Trust is the product.',
      body: 'Verification is typed, time-bound and explained. You see what was checked, not just a badge.',
      points: ['Clear checks', 'Honest badges', 'Human review'],
      aside:
        'No pay-to-win ranking. Every match comes with plain-language reasons you can read before you reply.',
    },
  },
  request: {
    title: 'Tell us who you need',
    intro: 'A few quick questions. We use your answers to put together a short, trusted shortlist.',
    cta: 'Tell us who you need',
    empty: {
      title: "Can't find them?",
      support: 'Tell us who you need and we will find them with you.',
    },
    steps: {
      label: 'Step {current} of {total}',
      next: 'Continue',
      back: 'Back',
      submit: 'Send request',
    },
    fields: {
      category: 'What kind of specialist do you need?',
      brief: 'What do you need done?',
      briefHint: 'Describe the outcome, not just the task.',
      scope: 'How do you want to work together?',
      timeline: 'When do you need them?',
      timelineHint: 'For example: "Start in two weeks" or "By 12 Mar 2027".',
      budget: 'Budget range in naira',
      budgetFlexible: 'Not sure — advise me',
      budgetMin: 'From',
      budgetMax: 'To',
      location: 'Location or remote preference',
      mustHave: 'Must-have skills',
      niceToHave: 'Nice-to-have skills',
      links: 'Links for context (optional)',
      skillsHint: 'Separate skills with commas.',
      linksHint: 'Separate links with commas.',
    },
    categories: {
      design: 'Design',
      software: 'Software',
      marketing: 'Marketing',
      consulting: 'Consulting',
      finance: 'Finance',
      creative: 'Creative',
      operations: 'Operations',
    },
    scopes: {
      one_off_project: 'One-off project',
      ongoing_retainer: 'Ongoing retainer',
      advisory: 'Advisory',
      not_sure: 'Not sure yet',
    },
    aside: {
      title: 'What happens next',
      body: 'We use your answers to prepare a short, relevant shortlist. You will hear from us within 24 hours.',
    },
    status: {
      signingIn: 'Sign in to send a request.',
      sent: 'Request received',
      sentSupport: "You'll hear from us within 24 hours.",
      busy: 'Sending your request…',
    },
  },
  errors: {
    unauthenticated: 'Sign in to continue.',
    forbidden: 'You do not have access to this resource.',
    validation: 'Check the information you provided.',
    rateLimited: 'Too many requests. Please try again shortly.',
    unavailable: 'This service is not available yet.',
    internal: 'Something went wrong. Please try again.',
  },
  about: {
    title: 'About Plugfindr',
    story: {
      prompt: 'For years, people around us kept asking the same question:',
      question: '"Do you know someone who can help with this?"',
      paragraphs: [
        'Usually, we did.',
        "We started Plugfindr to do what we've always done naturally: connect businesses with the right independent specialists.",
        "Because great specialists are everywhere. But finding the right person, at the right time, shouldn't be expensive, hit-or-miss or unnecessarily complicated.",
        "We're building a better way to discover, connect with and work with independent talent.",
        "Whatever you need done, there's probably a plug for that.",
      ],
      signoff: 'Plugfindr. We know someone.',
    },
  },
} as const;
