import { renderHook, waitFor } from '@testing-library/react';
import { useRawEntityDetail } from './useRawEntityDetail';
import { useApi } from '@backstage/core-plugin-api';

jest.mock('@backstage/core-plugin-api', () => ({
  ...jest.requireActual('@backstage/core-plugin-api'),
  useApi: jest.fn(),
}));

describe('useRawEntityDetails', () => {
  const mockApi = {
    getRawEntities: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (useApi as jest.Mock).mockReturnValue(mockApi);
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it('should return loading initially', () => {
    const { result } = renderHook(() => useRawEntityDetail('component:default/test'));
    expect(result.current.loading).toBe(true);
    expect(result.current.error).toBeUndefined();
    expect(result.current.rawEntities).toBeUndefined();
    expect(result.current.mergedEntity).toBeUndefined();
  });

  it('should return data once loaded', async () => {
    const mockResponse = {
      entities: [
        {
          providerId: 'provider-a',
          entityRef: 'component:default/test',
          entity: { apiVersion: 'v1', kind: 'Component', metadata: { name: 'test' }, spec: {} },
          priority: 1
        },
      ],
      merged: {
        apiVersion: 'v1',
        kind: 'Component',
        metadata: { name: 'test' },
        spec: {},
      },
    };

    mockApi.getRawEntities.mockResolvedValue(mockResponse);

    const { result } = renderHook(() => useRawEntityDetail('component:default/test'));

    await waitFor(() => expect(mockApi.getRawEntities).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.error).toBeUndefined();
    expect(result.current.rawEntities).toHaveLength(1);
    expect(result.current.mergedEntity).toBeDefined();
  });

  it('should handle error', async () => {
    const error = new Error('Test error');
    mockApi.getRawEntities.mockRejectedValue(error);

    const { result } = renderHook(() => useRawEntityDetail('component:default/test'));
    await waitFor(() => expect(mockApi.getRawEntities).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.error).toBe(error);
    expect(result.current.rawEntities).toBeUndefined();
    expect(result.current.mergedEntity).toBeUndefined();
  });
});