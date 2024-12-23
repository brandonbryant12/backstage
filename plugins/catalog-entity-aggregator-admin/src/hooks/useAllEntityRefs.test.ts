import { renderHook } from '@testing-library/react-hooks';
import { useAllEntityRefs } from './useAllEntityRefs';
import { useApi } from '@backstage/core-plugin-api';

jest.mock('@backstage/core-plugin-api', () => ({
  ...jest.requireActual('@backstage/core-plugin-api'),
  useApi: jest.fn(),
}));

describe('useAllEntityRefs', () => {
  const mockApi = {
    getAllEntities: jest.fn(),
  };

  beforeEach(() => {
    (useApi as jest.Mock).mockReturnValue(mockApi);
  });

  it('returns data after loading', async () => {
    const data = [
      { entityRef: 'component:default/service-a', dataSourceCount: 2 },
      { entityRef: 'component:default/service-b', dataSourceCount: 3 },
    ];
    mockApi.getAllEntities.mockResolvedValue(data);

    const { result, waitForNextUpdate } = renderHook(() => useAllEntityRefs());
    expect(result.current.loading).toBe(true);
    expect(result.current.data).toBeUndefined();

    await waitForNextUpdate();

    expect(result.current.loading).toBe(false);
    expect(result.current.data).toEqual(data);
    expect(result.current.error).toBeUndefined();
  });

  it('handles errors', async () => {
    const error = new Error('Test error');
    mockApi.getAllEntities.mockRejectedValue(error);

    const { result, waitForNextUpdate } = renderHook(() => useAllEntityRefs());
    await waitForNextUpdate();

    expect(result.current.loading).toBe(false);
    expect(result.current.data).toBeUndefined();
    expect(result.current.error).toBe(error);
  });
});