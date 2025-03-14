
/* <ai_context>
Component that displays API entities related to an entity via a specified relationship
</ai_context> */

import { ApiEntity } from '@backstage/catalog-model';
import { Typography } from '@mui/material';
import {
  useEntity,
  useRelatedEntities,
} from '@backstage/plugin-catalog-react';
import React from 'react';
import { EntityTable } from './EntityTable';
import {
  InfoCard,
  InfoCardVariants,
  Link,
  Progress,
  ResponseErrorPanel,
  TableColumn,
  TableOptions,
} from '@backstage/core-components';
import { apiEntityColumns } from './presets';

/**
 * Props for EntityApiRelationshipCard
 */
export interface EntityApiRelationshipCardProps {
  variant?: InfoCardVariants;
  title: string;
  columns?: TableColumn<ApiEntity>[];
  relationType: string;
  tableOptions?: TableOptions;
}

/**
 * A component for displaying APIs related to an entity
 */
export const EntityApiRelationshipCard = (props: EntityApiRelationshipCardProps) => {
  const {
    variant = 'gridItem',
    title,
    columns = apiEntityColumns,
    relationType,
    tableOptions = {},
  } = props;
  
  const { entity } = useEntity();
  const { entities, loading, error } = useRelatedEntities(entity, {
    type: relationType,
    kind: 'API',
  });

  if (loading) {
    return (
      <InfoCard variant={variant} title={title}>
        <Progress />
      </InfoCard>
    );
  }

  if (error) {
    return (
      <InfoCard variant={variant} title={title}>
        <ResponseErrorPanel error={error} />
      </InfoCard>
    );
  }

  const apiEntities = (entities || []) as ApiEntity[];
  const typeRelationship = relationType === 'providesApi' ? 'provide' : 'consume';

  return (
    <EntityTable
      title={title}
      variant={variant}
      emptyContent={
        <div style={{ textAlign: 'center' }}>
          <Typography variant="body1">
            This entity does not {typeRelationship} any APIs
          </Typography>
          <Typography variant="body2">
            <Link to="https://backstage.io/docs/features/software-catalog/descriptor-format#specprovidesapis-optional">
              Learn how to change this
            </Link>
          </Typography>
        </div>
      }
      columns={columns}
      entities={apiEntities}
      tableOptions={tableOptions}
    />
  );
};
      