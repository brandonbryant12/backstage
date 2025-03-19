import { renderInTestApp } from '@backstage/test-utils';
import { screen } from '@testing-library/react';
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

  beforeEach(() => {
    document.body.innerHTML = '';
  });

  it('renders Name column correctly', async () => {
    const NameColumn = columnFactories.createEntityRefColumn<Entity>();
    await renderInTestApp(NameColumn.render!(mockEntity, 0), {
      mountedRoutes: { '/catalog/:namespace/:kind/:name': entityRouteRef },
    });
    expect(screen.getByText('Test Entity')).toBeInTheDocument();
  });

  it('renders Owner column correctly', async () => {
    const OwnerColumn = columnFactories.createOwnerColumn<Entity>();
    await renderInTestApp(OwnerColumn.render!(mockEntity, 'row'), {
      mountedRoutes: { '/catalog/:namespace/:kind/:name': entityRouteRef },
    });
    expect(screen.getByText('team-a')).toBeInTheDocument();
  });

  it('renders Metadata Description column correctly', async () => {
    const DescriptionColumn = columnFactories.createMetadataDescriptionColumn<Entity>();
    await renderInTestApp(DescriptionColumn.render!(mockEntity, 'row'));
    expect(screen.getByText('This is a test entity')).toBeInTheDocument();
  });

  it('renders Lifecycle column correctly', () => {
    const LifecycleColumn = columnFactories.createSpecLifecycleColumn<Entity>();
    expect(LifecycleColumn.field).toBe('spec.lifecycle');
    expect(LifecycleColumn.title).toBe('Lifecycle');
  });

  it('renders Type column correctly', () => {
    const TypeColumn = columnFactories.createSpecTypeColumn<Entity>();
    expect(TypeColumn.field).toBe('spec.type');
    expect(TypeColumn.title).toBe('Type');
  });

  it('sorts entities correctly in Owner column customSort', () => {
    const OwnerColumn = columnFactories.createOwnerColumn<Entity>();

    const entityA: Entity = {
      ...mockEntity,
      relations: [
        {
          type: RELATION_OWNED_BY,
          targetRef: 'group:default/team-a',
        },
      ],
    };

    const entityB: Entity = {
      ...mockEntity,
      relations: [
        {
          type: RELATION_OWNED_BY,
          targetRef: 'group:default/team-z',
        },
      ],
    };

    const sortResult = OwnerColumn.customSort!(entityA, entityB, 'row');
    expect(sortResult).toBeLessThan(0);
  });
});
