import { useApi } from '@backstage/core-plugin-api';
import { catalogEntityAggregatorAdminApiRef } from '../api/CatalogEntityAggregatorAdminApi';
import { useAsync } from 'react-use';

export type AggregatorEntityRefData = {
  entityRef: string;
  providerCount: number;
};

/**
 * useAllEntityRefs - Hook to load aggregator entity references
 */
export function useAllEntityRefs() {
  const api = useApi(catalogEntityAggregatorAdminApiRef);

  const { loading, error, value } = useAsync(async () => {
    return await api.getAllEntities();
  }, []);

  return {
    loading,
    error,
    data: value,
  };
}