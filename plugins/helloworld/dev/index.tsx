import React from 'react';
import { createDevApp } from '@backstage/dev-utils';
import { helloworldPlugin, HelloworldPage } from '../src/plugin';

createDevApp()
  .registerPlugin(helloworldPlugin)
  .addPage({
    element: <HelloworldPage />,
    title: 'Root Page',
    path: '/helloworld',
  })
  .render();
