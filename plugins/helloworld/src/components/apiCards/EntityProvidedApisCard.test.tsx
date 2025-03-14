
import { Entity, RELATION_PROVIDES_API } from '@backstage/catalog-model';
import {
  catalogApiRef,
  EntityProvider,
  entityRouteRef,
} from '@backstage/plugin-catalog-react';
import { renderInTestApp, TestApiProvider } from '@backstage/test-utils';
import { screen, waitFor } from '@testing-library/react';
import React from 'react';
import { EntityProvidedApisCard } from './EntityProvidedApisCard';

describe('<EntityProvidedApisCard />', () => {
  const catalogApi = {
    getEntitiesByRefs: jest.fn(),
  };

  afterEach(() => jest.resetAllMocks());

  it('should show empty list when no relations exist', async () => {
    const entity: Entity = {
      apiVersion: 'v1',
      kind: 'Component',
      metadata: {
        name: 'test-component',
        namespace: 'default',
      },
      relations: [],
    };

    await renderInTestApp(
      <TestApiProvider apis={[[catalogApiRef, catalogApi]]}>
        <EntityProvider entity={entity}>
          <EntityProvidedApisCard />
        </EntityProvider>
      </TestApiProvider>,
      {
        mountedRoutes: {
          '/catalog/:namespace/:kind/:name': entityRouteRef,
        },
      },
    );

    expect(screen.getByText(/does not provide any APIs/i)).toBeInTheDocument();
    expect(screen.getByText('Learn how to change this')).toBeInTheDocument();
  });

  it('should display provided APIs', async () => {
    const entity: Entity = {
      apiVersion: 'v1',
      kind: 'Component',
      metadata: {
        name: 'test-component',
        namespace: 'default',
      },
      relations: [
        {
          targetRef: 'api:default/test-api',
          type: RELATION_PROVIDES_API,
        },
      ],
    };

    catalogApi.getEntitiesByRefs.mockResolvedValue({
      items: [
        {
          apiVersion: 'v1',
          kind: 'API',
          metadata: {
            name: 'test-api',
            namespace: 'default',
          },
          spec: {},
        },
      ],
    });

    await renderInTestApp(
      <TestApiProvider apis={[[catalogApiRef, catalogApi]]}>
        <EntityProvider entity={entity}>
          <EntityProvidedApisCard />
        </EntityProvider>
      </TestApiProvider>,
      {
        mountedRoutes: {
          '/catalog/:namespace/:kind/:name': entityRouteRef,
        },
      },
    );

    await waitFor(() => {
      expect(screen.getByText(/test-api/i)).toBeInTheDocument();
    });
  });
});
      