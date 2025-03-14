
import { Entity } from '@backstage/catalog-model';
import { renderInTestApp } from '@backstage/test-utils';
import { screen, waitFor } from '@testing-library/react';
import React from 'react';
import { EntityTable } from './EntityTable';

describe('<EntityTable />', () => {
  it('renders empty table with message', async () => {
    await renderInTestApp(
      <EntityTable
        entities={[]}
        emptyContent={<div>Empty state</div>}
        columns={[]}
      />,
    );
    expect(screen.getByText('Empty state')).toBeInTheDocument();
  });

  it('renders entities with columns', async () => {
    const entities: Entity[] = [
      {
        apiVersion: 'backstage.io/v1alpha1',
        kind: 'Component',
        metadata: {
          name: 'test-entity',
          namespace: 'default',
        },
        spec: {},
      },
    ];

    await renderInTestApp(
      <EntityTable
        entities={entities}
        emptyContent={<div>Empty state</div>}
        columns={[
          {
            title: 'Name',
            field: 'metadata.name',
          },
        ]}
      />,
    );

    await waitFor(() => {
      expect(screen.getByText('test-entity')).toBeInTheDocument();
    });
  });
});
      