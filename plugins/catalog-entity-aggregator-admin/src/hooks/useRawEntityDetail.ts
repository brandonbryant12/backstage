import { useApi } from '@backstage/core-plugin-api';
import { catalogEntityAggregatorAdminApiRef } from '../api/CatalogEntityAggregatorAdminApi';
import { useAsync } from 'react-use';
import { Entity } from '@backstage/catalog-model';

type RawEntity = {
  providerId: string;
  entityRef: string;
  entity: Entity;
  priority: number;
};

interface UseRawEntityDetailResult {
  loading: boolean;
  error: Error | undefined;
  rawEntities: RawEntity[] | undefined;
  mergedEntity: Entity | undefined;
}

export function useRawEntityDetail(entityRef: string): UseRawEntityDetailResult {
  const api = useApi(catalogEntityAggregatorAdminApiRef);

  const { loading, error, value } = useAsync(async () => {
    return await api.getRawEntities(entityRef);
  }, [entityRef]);

  return {
    loading,
    error,
    rawEntities: value?.entities,
    mergedEntity: value?.merged,
  };
}