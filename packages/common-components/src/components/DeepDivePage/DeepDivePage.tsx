import React, { ReactNode } from 'react';
import { useParams } from 'react-router-dom';
import {
AsyncEntityProvider,
useAsyncEntity,
} from '@backstage/plugin-catalog-react';
import { Progress, ResponseErrorPanel } from '@backstage/core-components';
import Grid from '@mui/material/Grid';
import { EntityHeader } from '../EntityHeader/EntityHeader';

export interface DeepDivePageProps {
  /** Optional explicit header title */
  title?: ReactNode;
  /** Optional subtitle shown under the title */
  subtitle?: ReactNode;
  /** Optional right-hand header actions */
  actions?: ReactNode;
  /** Main content */
  children?: ReactNode;
}

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
  // const { entity, loading, error } = useAsyncEntity();

  // if (loading) return <Progress />;
  // if (error || !entity) {
  //   return <ResponseErrorPanel error={error ?? new Error('Entity not found')} />;
  // }

  return (
    <>
      {/* <EntityHeader
        entity={entity}
        title={title}
        subtitle={subtitle}
        actions={actions}
      /> */}
      <Grid container spacing={3}>{children}</Grid>
    </>
  );
};

/**
 * Simplified wrapper for entity-level "Deep Dive" pages.
 * Always fetches the entity from URL parameters.
 */
export const DeepDivePage: React.FC<DeepDivePageProps> = ({
  title,
  subtitle,
  actions,
  children,
}) => {
  const { kind, namespace, name } = useParams<{
    kind: string;
    namespace?: string;
    name: string;
  }>();

  // Wait until the router has provided params
  if (!kind || !name) {
    return <Progress />;
  }

  const entityRef = `${kind}:${namespace ?? 'default'}/${name}`;
  return (
    <AsyncEntityProvider entityRef={entityRef} loadingComponent={<Progress />}>
      <DeepDiveContent title={title} subtitle={subtitle} actions={actions}>
        {children}
      </DeepDiveContent>
    </AsyncEntityProvider>
  );
};
