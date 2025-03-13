/* <ai_context>
The CatalogCardsPage component displays all catalog cards in a grid layout,
showing examples with mock data and no data for each card type.
</ai_context> */

import React from 'react';
import { Grid } from '@mui/material';
import {
  Content,
  ContentHeader,
  SupportButton,
} from '@backstage/core-components';
import {
  EntityDependsOnComponentsCard,
  EntityDependsOnResourcesCard,
  EntityHasSubcomponentsCard,
} from '../src';
import { Entity, RELATION_DEPENDS_ON, RELATION_HAS_PART } from '@backstage/catalog-model';
import { EntityProvider } from '@backstage/plugin-catalog-react';
import { TestApiProvider } from '@backstage/test-utils';
import { catalogApiRef } from '@backstage/plugin-catalog-react';

// Mock catalogApi implementation for the examples
const mockCatalogApi = {
  getEntityByRef: () => {},
  getEntities: () => {},
  getEntitiesByRefs: (refs) => {
    // Return mock data based on the requested refs
    const items = refs.map(ref => {
      if (ref.includes('component:default/backend')) {
        return {
          apiVersion: 'backstage.io/v1alpha1',
          kind: 'Component',
          metadata: {
            name: 'backend',
            namespace: 'default',
            description: 'Backend service',
          },
          spec: {
            type: 'service',
            lifecycle: 'production',
            owner: 'team-b',
          },
        };
      } else if (ref.includes('component:default/api')) {
        return {
          apiVersion: 'backstage.io/v1alpha1',
          kind: 'Component',
          metadata: {
            name: 'api',
            namespace: 'default',
            description: 'API service',
          },
          spec: {
            type: 'service',
            lifecycle: 'production',
            owner: 'team-c',
          },
        };
      } else if (ref.includes('resource:default/database')) {
        return {
          apiVersion: 'backstage.io/v1alpha1',
          kind: 'Resource',
          metadata: {
            name: 'database',
            namespace: 'default',
            description: 'PostgreSQL database',
          },
          spec: {
            type: 'database',
            lifecycle: 'production',
            owner: 'team-d',
          },
        };
      } else if (ref.includes('component:default/subcomponent-a')) {
        return {
          apiVersion: 'backstage.io/v1alpha1',
          kind: 'Component',
          metadata: {
            name: 'subcomponent-a',
            namespace: 'default',
            description: 'Subcomponent A',
          },
          spec: {
            type: 'library',
            lifecycle: 'production',
            owner: 'team-a',
          },
        };
      } else if (ref.includes('component:default/subcomponent-b')) {
        return {
          apiVersion: 'backstage.io/v1alpha1',
          kind: 'Component',
          metadata: {
            name: 'subcomponent-b',
            namespace: 'default',
            description: 'Subcomponent B',
          },
          spec: {
            type: 'library',
            lifecycle: 'production',
            owner: 'team-a',
          },
        };
      }
      return null;
    }).filter(Boolean);

    return { items };
  }),
  // Other required methods with empty implementations
  refreshEntity: () => {},
  getLocationById: () => {},
  getEntityByName: () => {},
  getOriginLocationByEntity: () => {},
  getLocationByRef: () => {},
  addLocation: () => {},
  removeLocationById: () => {},
  removeEntityByUid: () => {},
};

// Mock entity with no relations
const emptyEntity: Entity = {
  apiVersion: 'backstage.io/v1alpha1',
  kind: 'Component',
  metadata: {
    name: 'example-component',
    description: 'An example component for testing',
    namespace: 'default',
  },
  spec: {
    type: 'service',
    lifecycle: 'production',
    owner: 'team-a',
  },
  relations: [],
};

// Mock entity with dependencies
const entityWithDependencies: Entity = {
  apiVersion: 'backstage.io/v1alpha1',
  kind: 'Component',
  metadata: {
    name: 'example-with-dependencies',
    description: 'Component with dependencies',
    namespace: 'default',
  },
  spec: {
    type: 'service',
    lifecycle: 'production',
    owner: 'team-a',
  },
  relations: [
    {
      type: RELATION_DEPENDS_ON,
      targetRef: 'component:default/backend',
    },
    {
      type: RELATION_DEPENDS_ON,
      targetRef: 'component:default/api',
    },
    {
      type: RELATION_DEPENDS_ON,
      targetRef: 'resource:default/database',
    },
    {
      type: RELATION_HAS_PART,
      targetRef: 'component:default/subcomponent-a',
    },
    {
      type: RELATION_HAS_PART,
      targetRef: 'component:default/subcomponent-b',
    },
  ],
};

/**
 * Component that displays all catalog cards.
 */
export const CatalogCardsPage = () => {
  return (
    <TestApiProvider apis={[[catalogApiRef, mockCatalogApi]]}>
      <Content>
        <ContentHeader title="Catalog Cards">
          <SupportButton>Examples of all catalog card components</SupportButton>
        </ContentHeader>

        <Grid container spacing={3}>
          <Grid item md={6}>
            <EntityProvider entity={entityWithDependencies}>
              <EntityDependsOnComponentsCard />
            </EntityProvider>
          </Grid>
          <Grid item md={6}>
            <EntityProvider entity={emptyEntity}>
              <EntityDependsOnComponentsCard />
            </EntityProvider>
          </Grid>

          <Grid item md={6}>
            <EntityProvider entity={entityWithDependencies}>
              <EntityDependsOnResourcesCard />
            </EntityProvider>
          </Grid>
          <Grid item md={6}>
            <EntityProvider entity={emptyEntity}>
              <EntityDependsOnResourcesCard />
            </EntityProvider>
          </Grid>

          <Grid item md={6}>
            <EntityProvider entity={entityWithDependencies}>
              <EntityHasSubcomponentsCard />
            </EntityProvider>
          </Grid>
          <Grid item md={6}>
            <EntityProvider entity={emptyEntity}>
              <EntityHasSubcomponentsCard />
            </EntityProvider>
          </Grid>
        </Grid>
      </Content>
    </TestApiProvider>
  );
};
