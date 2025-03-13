
/* <ai_context>
Tests for the EntityConsumedApisCard component
</ai_context> */

import { Entity, RELATION_CONSUMES_API } from '@backstage/catalog-model';
import {
  catalogApiRef,
  EntityProvider,
  entityRouteRef,
} from '@backstage/plugin-catalog-react';
import { renderInTestApp, TestApiProvider } from '@backstage/test-utils';
import { screen, waitFor } from '@testing-library/react';
import React from 'react';
import { EntityConsumedApisCard } from './EntityConsumedApisCard';

describe('<EntityConsumedApisCard />', () => {
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
          <EntityConsumedApisCard />
        </EntityProvider>
      </Wrapper>,
      {
        mountedRoutes: {
          '/catalog/:namespace/:kind/:name': entityRouteRef,
        },
      },
    );

    expect(screen.getByText('Consumed APIs')).toBeInTheDocument();
    expect(screen.getByText(/does not consume any APIs/i)).toBeInTheDocument();
    expect(screen.getByText('Learn how to change this')).toBeInTheDocument();
  });

  it('should display consumed APIs', async () => {
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
          type: RELATION_CONSUMES_API,
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
          <EntityConsumedApisCard />
        </EntityProvider>
      </Wrapper>,
      {
        mountedRoutes: {
          '/catalog/:namespace/:kind/:name': entityRouteRef,
        },
      },
    );

    await waitFor(() => {
      expect(screen.getByText('Consumed APIs')).toBeInTheDocument();
      expect(screen.getByText(/test-api/i)).toBeInTheDocument();
    });
  });
});
      