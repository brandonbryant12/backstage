
/* <ai_context>
Tests for the EntityProvidedApisCard component
</ai_context> */

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

  const Wrapper = ({ children }: { children?: React.ReactNode }) => (
    <TestApiProvider apis={[[catalogApiRef, catalogApi]]}>
      {children}
    </TestApiProvider>
  );

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
      <Wrapper>
        <EntityProvider entity={entity}>
          <EntityProvidedApisCard />
        </EntityProvider>
      </Wrapper>,
      {
        mountedRoutes: {
          '/catalog/:namespace/:kind/:name': entityRouteRef,
        },
      },
    );

    expect(screen.getByText('Provided APIs')).toBeInTheDocument();
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
      <Wrapper>
        <EntityProvider entity={entity}>
          <EntityProvidedApisCard />
        </EntityProvider>
      </Wrapper>,
      {
        mountedRoutes: {
          '/catalog/:namespace/:kind/:name': entityRouteRef,
        },
      },
    );

    await waitFor(() => {
      expect(screen.getByText('Provided APIs')).toBeInTheDocument();
      expect(screen.getByText(/test-api/i)).toBeInTheDocument();
    });
  });
});
      