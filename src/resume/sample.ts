import { DEFAULT_ACCENT, DEFAULT_TEMPLATE, type Resume } from './types.ts';

/**
 * A clearly fictional person, loaded on the first visit. Every address uses the
 * reserved example.com / example.org domains and the phone number is a
 * placeholder. Some Spanish text is included on purpose (accents, ñ).
 */
export function sampleResume(): Resume {
  return {
    $schema: 'https://raw.githubusercontent.com/jsonresume/resume-schema/v1.0.0/schema.json',
    basics: {
      name: 'Alex Example',
      label: 'Data Engineer · Fictional sample CV',
      email: 'alex@example.com',
      phone: '+34 600 000 000',
      url: 'https://alex.example.com',
      summary:
        'Fictional person used to show what CV Kit can do. Data engineer who builds reliable pipelines and small, ' +
        'useful web tools. Enjoys turning messy sources into clean, documented datasets — and explaining them to people who are not engineers.',
      location: { city: 'Málaga', region: 'Andalucía', countryCode: 'ES' },
      profiles: [
        { network: 'GitHub', username: 'alex-example', url: 'https://github.com/example' },
        { network: 'LinkedIn', username: 'alex-example', url: 'https://www.linkedin.com/in/example' },
      ],
    },
    work: [
      {
        name: 'Example Analytics S.L.',
        position: 'Senior Data Engineer',
        location: 'Málaga, Spain (hybrid)',
        url: 'https://example.com',
        startDate: '2023-04',
        summary: 'Owns the batch and streaming pipelines behind the company’s weather and energy dashboards.',
        highlights: [
          'Moved 40 nightly jobs to an incremental medallion design, cutting run time from 3 h to 25 min.',
          'Introduced data contracts and tests; incidents caused by schema changes dropped by 70%.',
          'Mentors two junior engineers and runs the monthly data guild.',
        ],
      },
      {
        name: 'Fictional Logistics Co.',
        position: 'Data Engineer',
        location: 'Madrid, Spain',
        startDate: '2020-09',
        endDate: '2023-03',
        summary: 'Built the warehouse and reporting layer for a fleet of 1,200 vehicles.',
        highlights: [
          'Designed a dimensional model in DuckDB and PostgreSQL used by 60 analysts.',
          'Automated route-cost reports that had taken two people a full day each week.',
        ],
      },
      {
        name: 'Sample University Lab',
        position: 'Research Assistant',
        location: 'Granada, Spain',
        startDate: '2019-01',
        endDate: '2020-07',
        highlights: ['Cleaned and published 15 years of sensor data as an open dataset (CC BY 4.0).'],
      },
    ],
    education: [
      {
        institution: 'Universidad de Ejemplo',
        area: 'Ingeniería Informática (Computer Engineering)',
        studyType: 'BSc',
        startDate: '2014-09',
        endDate: '2018-06',
        score: '8.4 / 10',
        courses: ['Bases de datos', 'Estadística', 'Sistemas distribuidos'],
      },
    ],
    projects: [
      {
        name: 'Open Weather Warehouse',
        description: 'Hourly weather data warehouse for 52 Spanish cities, built only with free tools.',
        url: 'https://example.org/weather',
        startDate: '2024-02',
        keywords: ['Python', 'DuckDB', 'Parquet', 'GitHub Actions'],
      },
      {
        name: 'Tiny Budget App',
        description: 'Offline-first budgeting web app; data stays on the device.',
        startDate: '2022-05',
        endDate: '2022-11',
        keywords: ['TypeScript', 'IndexedDB'],
      },
    ],
    certificates: [
      { name: 'Cloud Data Engineer (fictional)', issuer: 'Example Cloud Academy', date: '2024-06-15' },
    ],
    awards: [{ title: 'Best Open Data Project', awarder: 'Sample Hackathon Málaga', date: '2021-11' }],
    volunteer: [
      {
        organization: 'Code Club Example',
        position: 'Volunteer teacher',
        startDate: '2021-01',
        summary: 'Teaches programming basics to teenagers on Saturday mornings.',
      },
    ],
    skills: [
      { name: 'Data engineering', level: 'Advanced', keywords: ['SQL', 'Python', 'DuckDB', 'Airflow', 'dbt'] },
      { name: 'Web', level: 'Intermediate', keywords: ['TypeScript', 'HTML', 'CSS', 'Vite'] },
      { name: 'Cloud & tooling', keywords: ['Docker', 'GitHub Actions', 'Cloudflare'] },
    ],
    languages: [
      { language: 'Español', fluency: 'Native' },
      { language: 'English', fluency: 'Professional (C1)' },
      { language: 'Français', fluency: 'Basic (A2)' },
    ],
    interests: [{ name: 'Outdoors', keywords: ['Hiking', 'Sailing'] }],
    references: [{ name: 'Sam Placeholder, Head of Data', reference: 'Available on request.' }],
    meta: {
      version: 'v1.0.0',
      cvkit: { template: DEFAULT_TEMPLATE, accent: DEFAULT_ACCENT, language: 'en', hideOnWeb: ['phone'] },
    },
  };
}

/** A blank resume that keeps the current CV Kit settings. */
export function emptyResume(settings?: Resume['meta']): Resume {
  return {
    $schema: 'https://raw.githubusercontent.com/jsonresume/resume-schema/v1.0.0/schema.json',
    basics: { name: '', label: '', email: '', phone: '', url: '', summary: '', location: {}, profiles: [] },
    work: [],
    education: [],
    skills: [],
    languages: [],
    projects: [],
    meta: {
      version: 'v1.0.0',
      cvkit: {
        template: settings?.cvkit?.template ?? DEFAULT_TEMPLATE,
        accent: settings?.cvkit?.accent ?? DEFAULT_ACCENT,
        language: settings?.cvkit?.language ?? 'en',
        hideOnWeb: ['phone'],
      },
    },
  };
}
