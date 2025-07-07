import React, { ReactNode } from 'react';
import { useParams } from 'react-router-dom';
import { useApi } from '@backstage/core-plugin-api';
import { AsyncEntityProvider, catalogApiRef } from '@backstage/plugin-catalog-react';
import { stringifyEntityRef } from '@backstage/catalog-model';
import { 
  Content,
  Progress, 
  ResponseErrorPanel,
  ErrorPanel 
} from '@backstage/core-components';
import { useQuery } from '@tanstack/react-query';
import Grid from '@mui/material/Grid';
import { EntityHeader } from '../EntityHeader/EntityHeader';

export interface DeepDivePageProps {
  /** Page title - defaults to entity name */
  title?: ReactNode;
  /** Optional subtitle */
  subtitle?: ReactNode;
  /** Header actions */
  actions?: ReactNode;
  /** Page content */
  children?: ReactNode;
}

interface RouteParams {
  kind: string;
  namespace?: string;
  name: string;
}

/**
 * Fetches entity from catalog using React Query
 */
export const useEntity = () => {
  const { kind, namespace = 'default', name } = useParams<RouteParams>();
  const catalogApi = useApi(catalogApiRef);
  
  const entityRef = React.useMemo(() => {
    if (!kind || !name) return null;
    try {
      return stringifyEntityRef({ kind, namespace, name });
    } catch {
      return null;
    }
  }, [kind, namespace, name]);

  return useQuery({
    queryKey: ['entity', entityRef],
    queryFn: async () => {
      if (!entityRef) throw new Error('Invalid entity reference');
      
      const entity = await catalogApi.getEntityByRef(entityRef);
      if (!entity) throw new Error(`Entity ${entityRef} not found`);
      
      return entity;
    },
    enabled: !!entityRef,
    staleTime: 5 * 60 * 1000,
    retry: (count, error) => count < 2 && !error.message?.includes('not found'),
  });
};

/**
 * Helper that consumes the loaded entity from context and renders the
 * header + page grid.
 */
const DeepDiveContent: React.FC<Omit<DeepDivePageProps, 'children'> & { children?: ReactNode }> = ({
  title,
  subtitle,
  actions,
  children,
}) => {
  return (
    <>
      <EntityHeader title={title} subtitle={subtitle} actions={actions} />
      <Grid container spacing={3}>{children}</Grid>
    </>
  );
};

/**
 * Entity-based page with automatic entity loading from URL params
 */
export const DeepDivePage: React.FC<DeepDivePageProps> = ({
  title,
  subtitle,
  actions,
  children,
}) => {
  const { data: entity, isLoading, error } = useEntity();

  if (isLoading) {
    return <Progress />;
  }

  if (error) {
    return (
      <ErrorPanel 
        error={error}
        defaultExpanded
      />
    );
  }

  if (!entity) {
    return <ResponseErrorPanel error={new Error('Entity not found')} />;
  }

  return (
   <AsyncEntityProvider entity={entity} loading={isLoading}>
    <Content>
      <DeepDiveContent title={title} subtitle={subtitle} actions={actions}>
        {children}
      </DeepDiveContent>
    </Content>
    </AsyncEntityProvider>
  );
};