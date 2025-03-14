
import { Entity, RELATION_HAS_PART } from '@backstage/catalog-model';
import {
  catalogApiRef,
  EntityProvider,
  entityRouteRef,
} from '@backstage/plugin-catalog-react';
import { renderInTestApp, TestApiProvider } from '@backstage/test-utils';
import { screen, waitFor } from '@testing-library/react';
import React from 'react';
import { EntityHasSubcomponentsCard } from './EntityHasSubcomponentsCard';

describe('<EntityHasSubcomponentsCard />', () => {
  const catalogApi = {
    getEntitiesByRefs: jest.fn(),
  };

  afterEach(() => jest.resetAllMocks());

  it('should show empty list if no relations', async () => {
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
          <EntityHasSubcomponentsCard />
        </EntityProvider>
      </TestApiProvider>,
      {
        mountedRoutes: {
          '/catalog/:namespace/:kind/:name': entityRouteRef,
        },
      },
    );

    expect(
      screen.getByText(/No subcomponent is part of this component/i),
    ).toBeInTheDocument();
  });

  it('should show related subcomponents', async () => {
    const entity: Entity = {
      apiVersion: 'v1',
      kind: 'Component',
      metadata: {
        name: 'test-component',
        namespace: 'default',
      },
      relations: [
        {
          targetRef: 'component:default/subcomponent',
          type: RELATION_HAS_PART,
        },
      ],
    };
    catalogApi.getEntitiesByRefs.mockResolvedValue({
      items: [
        {
          apiVersion: 'v1',
          kind: 'Component',
          metadata: {
            name: 'subcomponent',
            namespace: 'default',
          },
          spec: {},
        },
      ],
    });

    await renderInTestApp(
      <TestApiProvider apis={[[catalogApiRef, catalogApi]]}>
        <EntityProvider entity={entity}>
          <EntityHasSubcomponentsCard />
        </EntityProvider>
      </TestApiProvider>,
      {
        mountedRoutes: {
          '/catalog/:namespace/:kind/:name': entityRouteRef,
        },
      },
    );

    await waitFor(() => {
      expect(screen.getByText(/subcomponent/i)).toBeInTheDocument();
    });
  });
});
      