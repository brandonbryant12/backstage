import React from 'react';
import { createDevApp } from '@backstage/dev-utils';
import { helloworldPlugin, HelloworldPage, CatalogCardsPage, ApiCardsPage } from '../src/plugin';

createDevApp()
  .registerPlugin(helloworldPlugin)
  .addPage({
    element: <HelloworldPage />,
    title: 'Root Page',
    path: '/helloworld',
  })
  .addPage({
    element: <CatalogCardsPage />,
    title: 'Catalog Cards',
    path: '/helloworld/catalog-cards',
  })
  .addPage({
    element: <ApiCardsPage />,
    title: 'API Cards',
    path: '/helloworld/api-cards',
  })
  .render();
