import React from 'react';
import { createDevApp } from '@backstage/dev-utils';
import { helloworldPlugin } from '../src/plugin';
import { EntityConsumedApisCard } from '../src/components/apiCards/EntityConsumedApisCard';
import { EntityProvidedApisCard } from '../src/components/apiCards/EntityProvidedApisCard';
import { EntityDependsOnComponentsCard } from '../src/components/catalogCards/EntityDependsOnComponentsCard';
import { EntityDependsOnResourcesCard } from '../src/components/catalogCards/EntityDependsOnResourcesCard';
import { EntityHasSubcomponentsCard } from '../src/components/catalogCards/EntityHasSubcomponentsCard';
import { Entity, RELATION_CONSUMES_API, RELATION_PROVIDES_API } from '@backstage/catalog-model';
import {
  CatalogApi,
  EntityProvider,
  catalogApiRef,
} from '@backstage/plugin-catalog-react';
import { CatalogEntityPage, CatalogIndexPage } from '@backstage/plugin-catalog';
import { Grid } from '@mui/material';

const mockEntity: Entity = {
  apiVersion: 'backstage.io/v1alpha1',
  kind: 'Component',
  metadata: {
    name: 'test-component',
    namespace: 'default',
    description: 'A simple test component',
  },
  relations: [
    { type: RELATION_CONSUMES_API, targetRef: 'api:default/consumed-api' },
    { type: RELATION_PROVIDES_API, targetRef: 'api:default/provided-api' },
    { type: 'dependsOn', targetRef: 'component:default/dependency-component' },
    { type: 'dependsOn', targetRef: 'resource:default/dependency-resource' },
    { type: 'hasPart', targetRef: 'component:default/subcomponent' },
  ],
};

const mockEmptyEntity: Entity = {
  apiVersion: 'backstage.io/v1alpha1',
  kind: 'Component',
  metadata: {
    name: 'empty-component',
    namespace: 'default',
    description: 'An empty test component',
  },
  relations: [],
};

const mockEntitiesMap: Record<string, Entity> = {
  'api:default/consumed-api': {
    apiVersion: 'backstage.io/v1alpha1',
    kind: 'API',
    metadata: {
      name: 'consumed-api',
      namespace: 'default',
      description: 'A consumed API',
    },
    spec: {
      type: 'openapi',
      lifecycle: 'production',
    },
  },
  'api:default/provided-api': {
    apiVersion: 'backstage.io/v1alpha1',
    kind: 'API',
    metadata: {
      name: 'provided-api',
      namespace: 'default',
      description: 'A provided API',
    },
    spec: {
      type: 'graphql',
      lifecycle: 'experimental',
    },
  },
  'component:default/dependency-component': {
    apiVersion: 'backstage.io/v1alpha1',
    kind: 'Component',
    metadata: {
      name: 'dependency-component',
      namespace: 'default',
      description: 'A dependency component',
    },
    spec: {
      type: 'service',
      lifecycle: 'production',
    },
  },
  'resource:default/dependency-resource': {
    apiVersion: 'backstage.io/v1alpha1',
    kind: 'Resource',
    metadata: {
      name: 'dependency-resource',
      namespace: 'default',
      description: 'A dependency resource',
    },
    spec: {
      type: 'database',
      lifecycle: 'production',
    },
  },
  'component:default/subcomponent': {
    apiVersion: 'backstage.io/v1alpha1',
    kind: 'Component',
    metadata: {
      name: 'subcomponent',
      namespace: 'default',
      description: 'A subcomponent',
    },
    spec: {
      type: 'library',
      lifecycle: 'development',
    },
  },
};

const mockCatalogApi = {
  getEntitiesByRefs: async ({ entityRefs }) => {
    const items = entityRefs.map(ref => mockEntitiesMap[ref]).filter(Boolean);
    return { items };
  },
} as CatalogApi;

function createCardPage(card: JSX.Element) {
  return (
    <Grid container spacing={2} padding={2}>
      <Grid item xs={6}>
        <EntityProvider entity={mockEntity}>{card}</EntityProvider>
      </Grid>
      <Grid item xs={6}>
        <EntityProvider entity={mockEmptyEntity}>{card}</EntityProvider>
      </Grid>
    </Grid>
  );
}

createDevApp()
  .registerPlugin(helloworldPlugin)
  .registerApi({
    api: catalogApiRef,
    deps: {},
    factory: () => mockCatalogApi,
  })
  .addPage({ element: <CatalogIndexPage />, title: 'Catalog', path: '/catalog' })
  .addPage({
    element: <CatalogEntityPage />,
    title: 'Catalog Entity Page',
    path: '/catalog/:namespace/:kind/:name/*',
  })
  .addPage({
    element: createCardPage(<EntityConsumedApisCard />),
    title: 'Consumed APIs Card',
    path: '/helloworld/consumed-apis',
  })
  .addPage({
    element: createCardPage(<EntityProvidedApisCard />),
    title: 'Provided APIs Card',
    path: '/helloworld/provided-apis',
  })
  .addPage({
    element: createCardPage(<EntityDependsOnComponentsCard />),
    title: 'Depends On Components Card',
    path: '/helloworld/depends-on-components',
  })
  .addPage({
    element: createCardPage(<EntityDependsOnResourcesCard />),
    title: 'Depends On Resources Card',
    path: '/helloworld/depends-on-resources',
  })
  .addPage({
    element: createCardPage(<EntityHasSubcomponentsCard />),
    title: 'Has Subcomponents Card',
    path: '/helloworld/has-subcomponents',
  })
  .render();