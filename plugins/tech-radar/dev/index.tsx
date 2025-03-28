import React from 'react';
import { createDevApp } from '@backstage/dev-utils';
import { techRadarPlugin, TechRadarPage } from '../src/plugin';

createDevApp()
  .registerPlugin(techRadarPlugin)
  .addPage({
    element: <TechRadarPage />,
    title: 'Root Page',
    path: '/tech-radar',
  })
  .render();
