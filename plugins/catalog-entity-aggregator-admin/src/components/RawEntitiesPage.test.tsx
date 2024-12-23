import React from 'react';
import { renderInTestApp } from '@backstage/test-utils';
import { screen } from '@testing-library/react';
import { RawEntitiesPage } from './RawEntitiesPage';
import { useRawEntities } from '../hooks/useRawEntities';
import { useEntity } from '@backstage/plugin-catalog-react';

jest.mock('@backstage/plugin-catalog-react', () => ({
  useEntity: jest.fn(),
}));

jest.mock('../hooks/useRawEntities', () => ({
  useRawEntities: jest.fn(),
}));

describe('RawEntitiesPage', () => {
  beforeEach(() => {
    jest.resetAllMocks();
    (useEntity as jest.Mock).mockReturnValue({
      entity: {
        kind: 'Component',
        metadata: { name: 'test-entity', namespace: 'default' },
      },
    });
  });
  
  it('renders error state', async () => {
    (useRawEntities as jest.Mock).mockReturnValue({
      loading: false,
      error: new Error('Something went wrong'),
      rawEntities: undefined,
      mergedEntity: undefined,
    });

    await renderInTestApp(<RawEntitiesPage />);
    expect(screen.getByText('Error: Something went wrong')).toBeInTheDocument();
  });

  it('renders empty state', async () => {
    (useRawEntities as jest.Mock).mockReturnValue({
      loading: false,
      error: undefined,
      rawEntities: undefined,
      mergedEntity: undefined,
    });

    await renderInTestApp(<RawEntitiesPage />);
    expect(screen.getByText('No raw entity data could be found.')).toBeInTheDocument();
  });

  it('renders merged and raw entities and allows tab switching', async () => {
    (useRawEntities as jest.Mock).mockReturnValue({
      loading: false,
      error: undefined,
      rawEntities: [
        {
          datasource: 'datasource-a',
          entity: {
            apiVersion: 'backstage.io/v1alpha1',
            kind: 'Component',
            metadata: { name: 'test-entity' },
            spec: {},
          },
        },
        {
          datasource: 'datasource-b',
          entity: {
            apiVersion: 'backstage.io/v1alpha1',
            kind: 'Component',
            metadata: { name: 'test-entity-2' },
            spec: {},
          },
        },
      ],
      mergedEntity: {
        apiVersion: 'backstage.io/v1alpha1',
        kind: 'Component',
        metadata: { name: 'merged-entity' },
        spec: {},
      },
    });

    await renderInTestApp(<RawEntitiesPage />);
    expect(screen.getByText('Merged Entity')).toBeInTheDocument();
    const tabs = screen.getAllByRole('tab');
    expect(tabs.length).toBe(3);
  });
});