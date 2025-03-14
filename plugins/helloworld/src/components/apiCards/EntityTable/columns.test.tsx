import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { Entity, RELATION_OWNED_BY } from '@backstage/catalog-model';
import { columnFactories } from './columns';
import { wrapInTestApp } from '@backstage/test-utils';
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

  it('renders Name column correctly', () => {
    const NameColumn = columnFactories.createEntityRefColumn<Entity>();

    render(
      wrapInTestApp(NameColumn.render!(mockEntity, 0), {
        mountedRoutes: { '/catalog/:namespace/:kind/:name': entityRouteRef },
      }),
    );

    expect(screen.getByText('Test Entity')).toBeInTheDocument();
  });

  it('renders Owner column correctly', () => {
    const OwnerColumn = columnFactories.createOwnerColumn<Entity>();

    render(
      wrapInTestApp(OwnerColumn.render!(mockEntity, 0), {
        mountedRoutes: { '/catalog/:namespace/:kind/:name': entityRouteRef },
      }),
    );

    expect(screen.getByText('team-a')).toBeInTheDocument();
  });

  it('renders Metadata Description column correctly', () => {
    const DescriptionColumn = columnFactories.createMetadataDescriptionColumn<Entity>();

    render(DescriptionColumn.render!(mockEntity, 0));

    expect(screen.getByText('This is a test entity')).toBeInTheDocument();
  });

  it('renders Lifecycle column correctly', () => {
    const LifecycleColumn = columnFactories.createSpecLifecycleColumn<Entity>();

    expect(LifecycleColumn.field).toBe('spec.lifecycle');
    expect(LifecycleColumn.title).toBe('Lifecycle');
  });
});