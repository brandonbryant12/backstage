import { useApi } from '@backstage/core-plugin-api';
import { useEntity } from '@backstage/plugin-catalog-react';
import { stringifyEntityRef } from '@backstage/catalog-model';
import { catalogEntityAggregatorAdminApiRef } from '../api/catalogEntityAggregatorAdminApiRef';
import { useAsync } from 'react-use';

type EntityData = {
  apiVersion: string;
  kind: string;
  metadata: unknown;
  spec: unknown;
};

type RawEntity = {
  datasource: string;
  entity: EntityData;
};

type RawEntityResponse = {
  entities: RawEntity[];
  mergedEntity: EntityData;
};

interface UseRawEntitiesResult {
  loading: boolean;
  error: Error | undefined;
  rawEntities: RawEntity[] | undefined;
  mergedEntity: EntityData | undefined;
}

export function useRawEntities(): UseRawEntitiesResult {
  const { entity, loading: entityLoading, error: entityError } = useEntity();
  const api = useApi(catalogEntityAggregatorAdminApiRef);

  if (entityLoading || !entity) {
    return {
      loading: true,
      error: entityError,
      rawEntities: undefined,
      mergedEntity: undefined,
    };
  }

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