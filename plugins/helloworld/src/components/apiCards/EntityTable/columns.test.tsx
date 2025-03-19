import { renderInTestApp } from '@backstage/test-utils';
import '@testing-library/jest-dom';
import { Entity, RELATION_OWNED_BY } from '@backstage/catalog-model';
import { columnFactories } from './columns';
import { entityRouteRef } from '@backstage/plugin-catalog-react';

describe('columnFactories', () => {
  const mockEntity: Entity = {
    apiVersion: 'backstage.io/v1alpha1',
    kind: 'Component',
    metadata: {
      name: 'test-entity',
      title: 'Test Entity',
      description: 'This is a test entity',
    },
    spec: {
      lifecycle: 'production',
      type: 'service',
    },
    relations: [
      {
        type: RELATION_OWNED_BY,
        targetRef: 'group:default/team-a',
      },
    ],
  };

  it('renders Name column correctly', async () => {
    const NameColumn = columnFactories.createEntityRefColumn<Entity>();

    const { getByText } = await renderInTestApp(
      NameColumn.render!(mockEntity, 0),
      {
        mountedRoutes: { '/catalog/:namespace/:kind/:name': entityRouteRef },
      },
    );

    expect(getByText('Test Entity')).toBeInTheDocument();
  });

  it('renders Owner column correctly', async () => {
    const OwnerColumn = columnFactories.createOwnerColumn<Entity>();

    const { getByText } = await renderInTestApp(
      OwnerColumn.render!(mockEntity, 0),
      {
        mountedRoutes: { '/catalog/:namespace/:kind/:name': entityRouteRef },
      },
    );

    expect(getByText('team-a')).toBeInTheDocument();
  });

  it('renders Metadata Description column correctly', async () => {
    const DescriptionColumn = columnFactories.createMetadataDescriptionColumn<Entity>();

    const { getByText } = await renderInTestApp(
      DescriptionColumn.render!(mockEntity, 0),
    );

    expect(getByText('This is a test entity')).toBeInTheDocument();
  });

  it('renders Lifecycle column correctly', () => {
    const LifecycleColumn = columnFactories.createSpecLifecycleColumn<Entity>();

    expect(LifecycleColumn.field).toBe('spec.lifecycle');
    expect(LifecycleColumn.title).toBe('Lifecycle');
  });
});
