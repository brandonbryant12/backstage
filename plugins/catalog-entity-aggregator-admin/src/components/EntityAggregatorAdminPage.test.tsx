import React from 'react';
import { renderInTestApp } from '@backstage/test-utils';
import { EntityAggregatorAdminPage } from './EntityAggregatorAdminPage';
import { catalogEntityAggregatorAdminApiRef } from '../api/CatalogEntityAggregatorAdminApi';
import { TestApiProvider } from '@backstage/test-utils';
import { screen, waitFor, fireEvent } from '@testing-library/react';
import { AggregatorEntityRefData } from '../hooks/useAllEntityRefs';
import { useAllEntityRefs } from '../hooks/useAllEntityRefs';
import { useRawEntityDetail } from '../hooks/useRawEntityDetail';

jest.mock('../hooks/useAllEntityRefs', () => ({
  useAllEntityRefs: jest.fn(),
}));
jest.mock('../hooks/useRawEntityDetail', () => ({
  useRawEntityDetail: jest.fn(),
}));


describe('EntityAggregatorAdminPage', () => {
  const mockGetRawEntities = jest.fn();

  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('renders entity refs and opens details', async () => {
    (useAllEntityRefs as jest.Mock).mockReturnValue({
      loading: false,
      error: undefined,
      data: [
        { entityRef: 'component:default/service-a', dataSourceCount: 2 },
        { entityRef: 'component:default/service-b', dataSourceCount: 3 },
      ] as AggregatorEntityRefData[],
    });

    (useRawEntityDetail as jest.Mock).mockReturnValue({
      loading: false,
      error: undefined,
      rawEntities: [
        {
          datasource: 'datasource-a',
          entity: { apiVersion: 'v1', kind: 'Component', metadata: { name: 'test' }, spec: {} },
        },
      ],
      mergedEntity: {
        apiVersion: 'v1',
        kind: 'Component',
        metadata: { name: 'test' },
        spec: {},
      },
    });

    await renderInTestApp(
      <TestApiProvider
        apis={[
          [
            catalogEntityAggregatorAdminApiRef,
            {
              getRawEntities: mockGetRawEntities,
            },
          ],
        ]}
      >
        <EntityAggregatorAdminPage />
      </TestApiProvider>,
    );

    expect(await screen.findByText('component:default/service-a')).toBeInTheDocument();
    expect(await screen.findByText('component:default/service-b')).toBeInTheDocument();
    const viewButtons = screen.getAllByText('View Details');
    fireEvent.click(viewButtons[0]);
    await waitFor(() => {
      expect(screen.getByText(/"kind": "Component"/)).toBeInTheDocument();
    });
  });

  it('shows error panel when hook fails', async () => {
    (useAllEntityRefs as jest.Mock).mockReturnValue({
      loading: false,
      error: new Error('Something went wrong'),
      data: undefined,
    });

    await renderInTestApp(<EntityAggregatorAdminPage />);
    expect(await screen.findByText('Error: Something went wrong')).toBeInTheDocument();
  });
});