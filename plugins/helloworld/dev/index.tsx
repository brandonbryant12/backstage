
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
import { IntegrationsPage } from '../src/components/IntegrationsPage';

// Lorem ipsum description
const loremDescription = "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.";

// --- Mock Entities and API ---
// Define mock entity with relations for all cards
const mockEntity: Entity = {
  apiVersion: 'backstage.io/v1alpha1',
  kind: 'Component',
  metadata: {
    name: 'test-component',
    namespace: 'default',
    description: loremDescription,
  },
  relations: [
    // Create 15 consumed API relations to test pagination
    ...Array.from({ length: 15 }, (_, i) => ({
      type: RELATION_CONSUMES_API,
      targetRef: `api:default/consumed-api-${i + 1}`,
    })),
    // Create 15 provided API relations to test pagination
    ...Array.from({ length: 15 }, (_, i) => ({
      type: RELATION_PROVIDES_API,
      targetRef: `api:default/provided-api-${i + 1}`,
    })),
    // Create 15 depends-on component relations
    ...Array.from({ length: 15 }, (_, i) => ({
      type: 'dependsOn',
      targetRef: `component:default/dependency-component-${i + 1}`,
    })),
    // Create 15 depends-on resource relations
    ...Array.from({ length: 15 }, (_, i) => ({
      type: 'dependsOn',
      targetRef: `resource:default/dependency-resource-${i + 1}`,
    })),
    // Create 15 hasPart (subcomponent) relations
    ...Array.from({ length: 15 }, (_, i) => ({
      type: 'hasPart',
      targetRef: `component:default/subcomponent-${i + 1}`,
    })),
  ],
};

// Define mock entity with no relations
const mockEmptyEntity: Entity = {
  apiVersion: 'backstage.io/v1alpha1',
  kind: 'Component',
  metadata: {
    name: 'empty-component',
    namespace: 'default',
    description: loremDescription,
  },
  relations: [],
};

// Create a map of all mock entities
const mockEntitiesMap: Record<string, Entity> = {};

// Generate mock API entities
Array.from({ length: 15 }, (_, i) => {
  // Consumed APIs
  mockEntitiesMap[`api:default/consumed-api-${i + 1}`] = {
    apiVersion: 'backstage.io/v1alpha1',
    kind: 'API',
    metadata: {
      name: `consumed-api-${i + 1}`,
      namespace: 'default',
      description: `${loremDescription} This is consumed API #${i + 1}.`,
    },
    spec: {
      type: i % 3 === 0 ? 'openapi' : i % 3 === 1 ? 'graphql' : 'grpc',
      lifecycle: i % 4 === 0 ? 'production' : i % 4 === 1 ? 'experimental' : i % 4 === 2 ? 'deprecated' : 'development',
    },
  };

  // Provided APIs
  mockEntitiesMap[`api:default/provided-api-${i + 1}`] = {
    apiVersion: 'backstage.io/v1alpha1',
    kind: 'API',
    metadata: {
      name: `provided-api-${i + 1}`,
      namespace: 'default',
      description: `${loremDescription} This is provided API #${i + 1}.`,
    },
    spec: {
      type: i % 3 === 0 ? 'openapi' : i % 3 === 1 ? 'graphql' : 'grpc',
      lifecycle: i % 4 === 0 ? 'production' : i % 4 === 1 ? 'experimental' : i % 4 === 2 ? 'deprecated' : 'development',
    },
  };

  // Dependency Components
  mockEntitiesMap[`component:default/dependency-component-${i + 1}`] = {
    apiVersion: 'backstage.io/v1alpha1',
    kind: 'Component',
    metadata: {
      name: `dependency-component-${i + 1}`,
      namespace: 'default',
      description: `${loremDescription} This is dependency component #${i + 1}.`,
    },
    spec: {
      type: i % 3 === 0 ? 'service' : i % 3 === 1 ? 'website' : 'library',
      lifecycle: i % 4 === 0 ? 'production' : i % 4 === 1 ? 'experimental' : i % 4 === 2 ? 'deprecated' : 'development',
    },
  };

  // Dependency Resources
  mockEntitiesMap[`resource:default/dependency-resource-${i + 1}`] = {
    apiVersion: 'backstage.io/v1alpha1',
    kind: 'Resource',
    metadata: {
      name: `dependency-resource-${i + 1}`,
      namespace: 'default',
      description: `${loremDescription} This is dependency resource #${i + 1}.`,
    },
    spec: {
      type: i % 3 === 0 ? 'database' : i % 3 === 1 ? 'queue' : 'storage',
      lifecycle: i % 4 === 0 ? 'production' : i % 4 === 1 ? 'experimental' : i % 4 === 2 ? 'deprecated' : 'development',
    },
  };

  // Subcomponents
  mockEntitiesMap[`component:default/subcomponent-${i + 1}`] = {
    apiVersion: 'backstage.io/v1alpha1',
    kind: 'Component',
    metadata: {
      name: `subcomponent-${i + 1}`,
      namespace: 'default',
      description: `${loremDescription} This is subcomponent #${i + 1}.`,
    },
    spec: {
      type: i % 3 === 0 ? 'library' : i % 3 === 1 ? 'module' : 'service',
      lifecycle: i % 4 === 0 ? 'production' : i % 4 === 1 ? 'experimental' : i % 4 === 2 ? 'deprecated' : 'development',
    },
  };
});

// Define mock catalog API
const mockCatalogApi = {
  getEntitiesByRefs: async ({ entityRefs }: { entityRefs: string[] }) => {
    const items = entityRefs.map(ref => mockEntitiesMap[ref]).filter(Boolean);
    return { items };
  },
};

// Helper to create a page with two EntityProviders (one with an entity and one empty)
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

// Create a page with EntityProvider for the IntegrationsPage
function createIntegrationsPage() {
  return (
    <EntityProvider entity={mockEntity}>
      <IntegrationsPage />
    </EntityProvider>
  );
}

// --- Create and render the dev app ---
createDevApp()
  // Register the helloworld plugin
  .registerPlugin(helloworldPlugin)
  // Register the mock catalog API
  .registerApi({
    api: catalogApiRef,
    deps: {},
    factory: () => mockCatalogApi as CatalogApi,
  })
  // Register Catalog pages to bind the route refs
  .addPage({
    element: <CatalogIndexPage />,
    title: 'Catalog',
    path: '/catalog',
  })
  .addPage({
    element: <CatalogEntityPage />,
    title: 'Catalog Entity Page',
    path: '/catalog/:namespace/:kind/:name/*',
  })
  // Register API Card pages
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
  // Register Catalog Card pages
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
  // Register Integrations page
  .addPage({
    element: createIntegrationsPage(),
    title: 'Integrations Page',
    path: '/helloworld/integrations',
  })
  .render();
      