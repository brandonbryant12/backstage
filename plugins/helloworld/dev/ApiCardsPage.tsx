/* <ai_context>
The ApiCardsPage component displays all API cards in a grid layout,
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
  EntityConsumedApisCard,
  EntityProvidedApisCard,
} from './apiCards';
import { Entity, RELATION_CONSUMES_API, RELATION_PROVIDES_API } from '@backstage/catalog-model';
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
      if (ref.includes('api:default/rest-api')) {
        return {
          apiVersion: 'backstage.io/v1alpha1',
          kind: 'API',
          metadata: {
            name: 'rest-api',
            namespace: 'default',
            description: 'REST API for user management',
          },
          spec: {
            type: 'openapi',
            lifecycle: 'production',
            owner: 'team-a',
            definition: '...',
          },
        };
      } else if (ref.includes('api:default/graphql-api')) {
        return {
          apiVersion: 'backstage.io/v1alpha1',
          kind: 'API',
          metadata: {
            name: 'graphql-api',
            namespace: 'default',
            description: 'GraphQL API for data queries',
          },
          spec: {
            type: 'graphql',
            lifecycle: 'production',
            owner: 'team-b',
            definition: '...',
          },
        };
      } else if (ref.includes('api:default/grpc-api')) {
        return {
          apiVersion: 'backstage.io/v1alpha1',
          kind: 'API',
          metadata: {
            name: 'grpc-api',
            namespace: 'default',
            description: 'gRPC API for internal services',
          },
          spec: {
            type: 'grpc',
            lifecycle: 'production',
            owner: 'team-c',
            definition: '...',
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

// Mock entity with API relations
const entityWithApis: Entity = {
  apiVersion: 'backstage.io/v1alpha1',
  kind: 'Component',
  metadata: {
    name: 'example-with-apis',
    description: 'Component with API relationships',
    namespace: 'default',
  },
  spec: {
    type: 'service',
    lifecycle: 'production',
    owner: 'team-a',
  },
  relations: [
    {
      type: RELATION_PROVIDES_API,
      targetRef: 'api:default/rest-api',
    },
    {
      type: RELATION_PROVIDES_API,
      targetRef: 'api:default/graphql-api',
    },
    {
      type: RELATION_CONSUMES_API,
      targetRef: 'api:default/grpc-api',
    },
  ],
};

/**
 * Component that displays all API cards.
 */
export const ApiCardsPage = () => {
  return (
    <TestApiProvider apis={[[catalogApiRef, mockCatalogApi]]}>
      <Content>
        <ContentHeader title="API Cards">
          <SupportButton>Examples of all API card components</SupportButton>
        </ContentHeader>

        <Grid container spacing={3}>
          <Grid item md={6}>
            <EntityProvider entity={entityWithApis}>
              <EntityProvidedApisCard />
            </EntityProvider>
          </Grid>
          <Grid item md={6}>
            <EntityProvider entity={emptyEntity}>
              <EntityProvidedApisCard />
            </EntityProvider>
          </Grid>

          <Grid item md={6}>
            <EntityProvider entity={entityWithApis}>
              <EntityConsumedApisCard />
            </EntityProvider>
          </Grid>
          <Grid item md={6}>
            <EntityProvider entity={emptyEntity}>
              <EntityConsumedApisCard />
            </EntityProvider>
          </Grid>
        </Grid>
      </Content>
    </TestApiProvider>
  );
};
