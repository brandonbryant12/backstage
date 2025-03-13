
/* <ai_context>
Dev server entry point for the helloworld plugin, showcasing various entity-related cards.
</ai_context> */

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
  EntityProvider,
  catalogApiRef,
  entityRouteRef,
} from '@backstage/plugin-catalog-react';
import { Grid } from '@mui/material';
import { catalogPlugin } from '@backstage/plugin-catalog';

// Define mock entity with relations for all cards
const mockEntity: Entity = {
  apiVersion: 'backstage.io/v1alpha1',
  kind: 'Component',
  metadata: {
    name: 'test-component',
    namespace: 'default',
  },
  relations: [
    {
      type: RELATION_CONSUMES_API,
      targetRef: 'api:default/test-api',
    },
    {
      type: RELATION_PROVIDES_API,
      targetRef: 'api:default/provided-api',
    },
    {
      type: 'dependsOn',
      targetRef: 'component:default/dependency-component',
    },
    {
      type: 'dependsOn',
      targetRef: 'resource:default/dependency-resource',
    },
    {
      type: 'hasPart',
      targetRef: 'component:default/subcomponent',
    },
  ],
};

// Define mock entity with no relations
const mockEmptyEntity: Entity = {
  apiVersion: 'backstage.io/v1alpha1',
  kind: 'Component',
  metadata: {
    name: 'empty-component',
    namespace: 'default',
  },
  relations: [],
};

// Define mock entities for relations
const mockApiEntity: Entity = {
  apiVersion: 'backstage.io/v1alpha1',
  kind: 'API',
  metadata: {
    name: 'test-api',
    namespace: 'default',
  },
  spec: {
    type: 'openapi',
    lifecycle: 'production',
  },
};

const mockProvidedApiEntity: Entity = {
  apiVersion: 'backstage.io/v1alpha1',
  kind: 'API',
  metadata: {
    name: 'provided-api',
    namespace: 'default',
  },
  spec: {
    type: 'graphql',
    lifecycle: 'experimental',
  },
};

const mockDependencyComponent: Entity = {
  apiVersion: 'backstage.io/v1alpha1',
  kind: 'Component',
  metadata: {
    name: 'dependency-component',
    namespace: 'default',
  },
  spec: {
    type: 'service',
    lifecycle: 'production',
  },
};

const mockDependencyResource: Entity = {
  apiVersion: 'backstage.io/v1alpha1',
  kind: 'Resource',
  metadata: {
    name: 'dependency-resource',
    namespace: 'default',
  },
  spec: {
    type: 'database',
    lifecycle: 'production',
  },
};

const mockSubcomponent: Entity = {
  apiVersion: 'backstage.io/v1alpha1',
  kind: 'Component',
  metadata: {
    name: 'subcomponent',
    namespace: 'default',
  },
  spec: {
    type: 'library',
    lifecycle: 'experimental',
  },
};

const mockEntitiesMap: Record<string, Entity> = {
  'api:default/test-api': mockApiEntity,
  'api:default/provided-api': mockProvidedApiEntity,
  'component:default/dependency-component': mockDependencyComponent,
  'resource:default/dependency-resource': mockDependencyResource,
  'component:default/subcomponent': mockSubcomponent,
};

// Define mock catalog API
const mockCatalogApi = {
  getEntitiesByRefs: async ({ entityRefs }: { entityRefs: string[] }) => {
    const items = entityRefs.map(ref => mockEntitiesMap[ref]).filter(Boolean);
    return { items };
  },
};

// Helper to create a card page with both a populated entity and an empty entity
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

// Configure dev server with pages for each card
createDevApp()
  .registerPlugin(catalogPlugin)
  .registerPlugin(helloworldPlugin)
  // Bind the mock catalog API for dev usage
  .registerApi({
    api: catalogApiRef,
    deps: {},
    factory: () => mockCatalogApi,
  })
  // Provide a simple entity page route so that EntityRefLink and similar references can resolve
  .addPage({
    element: <div>Dev Entity Page (Placeholder)</div>,
    title: 'Entity Page',
    path: '/catalog/:namespace/:kind/:name',
  })
  // Then the custom pages for each card
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
      