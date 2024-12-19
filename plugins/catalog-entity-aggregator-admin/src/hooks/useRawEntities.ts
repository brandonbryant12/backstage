import { useApi } from '@backstage/core-plugin-api';
import { useEntity } from '@backstage/plugin-catalog-react';
import { stringifyEntityRef } from '@backstage/catalog-model';
import { catalogEntityAggregatorAdminApiRef } from '../api/catalogEntityAggregatorAdminApiRef';
import { useAsync } from 'react-use';
import { Entity } from '@backstage/catalog-model';


type RawEntity = {
  datasource: string;
  entity: Entity;
};

interface UseRawEntitiesResult {
  loading: boolean;
  error: Error | undefined;
  rawEntities: RawEntity[] | undefined;
  mergedEntity: Entity | undefined;
}

export function useRawEntities(): UseRawEntitiesResult {
  const { entity } = useEntity();
  const api = useApi(catalogEntityAggregatorAdminApiRef);
  const entityRef = stringifyEntityRef(entity);
  const { loading, error, value } = useAsync(async () => {
    return await api.getRawEntities(entityRef);
  }, [entityRef]);

  return {
    loading,
    error,
    rawEntities: value?.entities,
    mergedEntity: value?.mergedEntity,
  };
}