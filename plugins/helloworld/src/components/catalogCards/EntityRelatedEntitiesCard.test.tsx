
import { Entity } from '@backstage/catalog-model';
import {
  catalogApiRef,
  EntityProvider,
  entityRouteRef,
} from '@backstage/plugin-catalog-react';
import { renderInTestApp, TestApiProvider } from '@backstage/test-utils';
import { screen, waitFor } from '@testing-library/react';
import React from 'react';
import { EntityRelatedEntitiesCard } from './EntityRelatedEntitiesCard';

describe('<EntityRelatedEntitiesCard />', () => {
  const catalogApi = {
    getEntitiesByRefs: jest.fn(),
  };

  const Wrapper = ({ children }: { children?: React.ReactNode }) => (
    <TestApiProvider apis={[[catalogApiRef, catalogApi]]}>
      {children}
    </TestApiProvider>
  );

  afterEach(() => jest.resetAllMocks());

  it('should display empty message when no related entities exist', async () => {
    const entity: Entity = {
      apiVersion: 'v1',
      kind: 'Component',
      metadata: {
        name: 'test-component',
        namespace: 'default',
      },
      relations: [],
    };

    const renderEntities = (entities: Entity[]) => entities as Entity[];

    await renderInTestApp(
      <Wrapper>
        <EntityProvider entity={entity}>
          <EntityRelatedEntitiesCard
            columns={[]}
            relationType="test"
            emptyMessage="No related entities"
            emptyHelpLink="https://example.com"
            asRenderableEntities={renderEntities}
          />
        </EntityProvider>
      </Wrapper>,
      {
        mountedRoutes: {
          '/catalog/:namespace/:kind/:name': entityRouteRef,
        },
      },
    );

    // Removed title expectation as the component no longer renders a title.
    expect(screen.getByText('No related entities')).toBeInTheDocument();
    expect(screen.getByText('Learn how to change this')).toBeInTheDocument();
  });

  it('should display related entities when they exist', async () => {
    const entity: Entity = {
      apiVersion: 'v1',
      kind: 'Component',
      metadata: {
        name: 'test-component',
        namespace: 'default',
      },
      relations: [
        {
          targetRef: 'component:default/related-entity',
          type: 'test',
        },
      ],
    };

    catalogApi.getEntitiesByRefs.mockResolvedValue({
      items: [
        {
          apiVersion: 'v1',
          kind: 'Component',
          metadata: {
            name: 'related-entity',
            namespace: 'default',
          },
          spec: {},
        },
      ],
    });

    const renderEntities = (entities: Entity[]) => entities as Entity[];

    await renderInTestApp(
      <Wrapper>
        <EntityProvider entity={entity}>
          <EntityRelatedEntitiesCard
            columns={[{ title: 'Name', field: 'metadata.name' }]}
            relationType="test"
            emptyMessage="No related entities"
            emptyHelpLink="https://example.com"
            asRenderableEntities={renderEntities}
          />
        </EntityProvider>
      </Wrapper>,
      {
        mountedRoutes: {
          '/catalog/:namespace/:kind/:name': entityRouteRef,
        },
      },
    );

    await waitFor(() => {
      expect(screen.getByText('related-entity')).toBeInTheDocument();
    });
  });
});