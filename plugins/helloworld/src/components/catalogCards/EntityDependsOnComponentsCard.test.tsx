
/* <ai_context>
Tests for the EntityDependsOnComponentsCard component
</ai_context> */

import { Entity, RELATION_DEPENDS_ON } from '@backstage/catalog-model';
import {
  catalogApiRef,
  EntityProvider,
  entityRouteRef,
} from '@backstage/plugin-catalog-react';
import { renderInTestApp, TestApiProvider } from '@backstage/test-utils';
import { screen, waitFor } from '@testing-library/react';
import React from 'react';
import { EntityDependsOnComponentsCard } from './EntityDependsOnComponentsCard';

describe('<EntityDependsOnComponentsCard />', () => {
  const catalogApi = {
    getEntitiesByRefs: jest.fn(),
  };

  const Wrapper = ({ children }: { children?: React.ReactNode }) => (
    <TestApiProvider apis={[[catalogApiRef, catalogApi]]}>
      {children}
    </TestApiProvider>
  );

  afterEach(() => jest.resetAllMocks());

  it('should show empty list if no dependencies', async () => {
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
          <EntityDependsOnComponentsCard />
        </EntityProvider>
      </Wrapper>,
      {
        mountedRoutes: {
          '/catalog/:namespace/:kind/:name': entityRouteRef,
        },
      },
    );

    expect(screen.getByText('Depends on components')).toBeInTheDocument();
    expect(
      screen.getByText(/No component is a dependency of this component/i),
    ).toBeInTheDocument();
  });

  it('should show dependency components', async () => {
    const entity: Entity = {
      apiVersion: 'v1',
      kind: 'Component',
      metadata: {
        name: 'test-component',
        namespace: 'default',
      },
      relations: [
        {
          targetRef: 'component:default/dependency-component',
          type: RELATION_DEPENDS_ON,
        },
      ],
    };
    catalogApi.getEntitiesByRefs.mockResolvedValue({
      items: [
        {
          apiVersion: 'v1',
          kind: 'Component',
          metadata: {
            namespace: 'default',
            name: 'dependency-component',
          },
          spec: {},
        },
      ],
    });

    await renderInTestApp(
      <Wrapper>
        <EntityProvider entity={entity}>
          <EntityDependsOnComponentsCard />
        </EntityProvider>
      </Wrapper>,
      {
        mountedRoutes: {
          '/catalog/:namespace/:kind/:name': entityRouteRef,
        },
      },
    );

    await waitFor(() => {
      expect(screen.getByText('Depends on components')).toBeInTheDocument();
      expect(screen.getByText(/dependency-component/i)).toBeInTheDocument();
    });
  });
});
      