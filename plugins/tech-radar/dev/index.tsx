import React from 'react';
import { createDevApp } from '@backstage/dev-utils';
import { techRadarPlugin } from '../src/plugin';
import { RadarPage, techRadarApiRef } from '@backstage-community/plugin-tech-radar';
import { mockApiClient } from '../src/api/mockClient';

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