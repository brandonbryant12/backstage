import React from 'react';
import { createDevApp } from '@backstage/dev-utils';
import { techRadarPlugin } from '../src/plugin';
import { RadarPage, techRadarApiRef } from '@backstage-community/plugin-tech-radar';
import { TechRadarLoaderResponse } from '@backstage-community/plugin-tech-radar-common';

const mockData: TechRadarLoaderResponse = {
  quadrants: [
    { id: 'patterns', name: 'Patterns' }, // Top-Left
    { id: 'guidelines', name: 'Guidelines' }, // Top-Right
    { id: 'solutions', name: 'Solutions' }, // Bottom-Right
    { id: 'standards', name: 'Standards' }, // Bottom-Left
  ],
  rings: [
    { id: 'approved', name: 'Approved', color: '#93c47d' },
    { id: 'emerging', name: 'Emerging', color: '#fbdb84' },
    { id: 'restricted', name: 'Restricted', color: '#efafa9' },
  ],
  entries: [
    {
      id: 'react',
      key: 'react',
      title: 'React',
      quadrant: 'solutions',
      timeline: [
        { moved: 0, ringId: 'approved', date: new Date('2023-01-15T00:00:00.000Z'), description: 'A JavaScript library for building user interfaces.' },
      ],
      url: 'https://reactjs.org/'
    },
    {
      id: 'typescript',
      key: 'typescript',
      title: 'TypeScript',
      quadrant: 'standards',
      timeline: [
        { moved: 0, ringId: 'approved', date: new Date('2022-11-20T00:00:00.000Z'), description: 'Strongly typed programming language that builds on JavaScript.' },
      ],
      url: 'https://www.typescriptlang.org/'
    },
    {
      id: 'graphql',
      key: 'graphql',
      title: 'GraphQL',
      quadrant: 'patterns',
      timeline: [
        { moved: 0, ringId: 'emerging', date: new Date('2023-05-10T00:00:00.000Z'), description: 'A query language for APIs and a runtime for fulfilling those queries with your existing data.' },
      ],
      url: 'https://graphql.org/'
    },
    {
      id: 'cicd_pipelines',
      key: 'cicd_pipelines',
      title: 'CI/CD Pipelines',
      quadrant: 'guidelines',
      timeline: [
        { moved: 0, ringId: 'approved', date: new Date('2023-03-01T00:00:00.000Z'), description: 'Automated pipelines for building, testing, and deploying applications.' },
      ],
      url: '#'
    },
    {
      id: 'legacy_system_x',
      key: 'legacy_system_x',
      title: 'Legacy System X',
      quadrant: 'solutions',
      timeline: [
        { moved: 0, ringId: 'restricted', date: new Date('2023-06-30T00:00:00.000Z'), description: 'An old system planned for deprecation.' },
      ],
      url: '#'
    },
  ],
};

const mockApiClient = {
  load: async (_id: string | undefined): Promise<TechRadarLoaderResponse> => {
    return mockData;
  },
};

createDevApp()
  .registerPlugin(techRadarPlugin)
  .registerApi({
    api: techRadarApiRef,
    deps: {},
    factory: () => mockApiClient,
  })
  .addPage({
    element: <RadarPage height={1000} width={1600} />,
    title: 'Tech Radar',
    path: '/tech-radar',
  })
  .render();