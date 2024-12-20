import { renderHook } from '@testing-library/react-hooks';
import { useRawEntities } from './useRawEntities';
import { useApi } from '@backstage/core-plugin-api';
import { useEntity } from '@backstage/plugin-catalog-react';

jest.mock('@backstage/core-plugin-api', () => ({
  ...jest.requireActual('@backstage/core-plugin-api'),
  useApi: jest.fn(),
}));

jest.mock('@backstage/plugin-catalog-react', () => ({
  ...jest.requireActual('@backstage/plugin-catalog-react'),
  useEntity: jest.fn(),
}));

describe('useRawEntities', () => {
  const mockApi = {
    getRawEntities: jest.fn(),
  };

  beforeEach(() => {
    (useApi as jest.Mock).mockReturnValue(mockApi);
    (useEntity as jest.Mock).mockReturnValue({ entity: { kind: 'Component', metadata: { name: 'test', namespace: 'default' } } });
  });

  it('should return loading initially', () => {
    const { result } = renderHook(() => useRawEntities());
    expect(result.current.loading).toBe(true);
    expect(result.current.error).toBeUndefined();
    expect(result.current.rawEntities).toBeUndefined();
    expect(result.current.mergedEntity).toBeUndefined();
  });

  it('should return data once loaded', async () => {
    mockApi.getRawEntities.mockResolvedValue({
      entities: [
        { datasource: 'a', entity: { apiVersion:'v1', kind:'Component', metadata:{name:'test'}, spec:{} } },
      ],
      mergedEntity: { apiVersion:'v1', kind:'Component', metadata:{name:'test'}, spec:{} },
    });

    const { result, waitForNextUpdate } = renderHook(() => useRawEntities());
    await waitForNextUpdate();

    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeUndefined();
    expect(result.current.rawEntities).toHaveLength(1);
    expect(result.current.mergedEntity).toBeDefined();
  });

  it('should handle error', async () => {
    const error = new Error('Test error');
    mockApi.getRawEntities.mockRejectedValue(error);

    const { result, waitForNextUpdate } = renderHook(() => useRawEntities());
    await waitForNextUpdate();

    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBe(error);
    expect(result.current.rawEntities).toBeUndefined();
    expect(result.current.mergedEntity).toBeUndefined();
  });
});