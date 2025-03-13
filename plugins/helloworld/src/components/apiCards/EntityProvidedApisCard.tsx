
/* <ai_context>
Component that displays APIs provided by an entity, migrated to MUI 5.
</ai_context> */

import { ApiEntity, RELATION_PROVIDES_API } from '@backstage/catalog-model';
import { Typography } from '@mui/material';
import {
  useEntity,
  useRelatedEntities,
} from '@backstage/plugin-catalog-react';
import React from 'react';
import { apiEntityColumns } from './presets';
import { EntityTable } from './EntityTable';
import {
  CodeSnippet,
  InfoCard,
  InfoCardVariants,
  Link,
  Progress,
  TableColumn,
  TableOptions,
  WarningPanel,
} from '@backstage/core-components';

/**
 * Props for EntityProvidedApisCard
 */
export interface EntityProvidedApisCardProps {
  variant?: InfoCardVariants;
  title?: string;
  columns?: TableColumn<ApiEntity>[];
  tableOptions?: TableOptions;
}

/**
 * Component showing provided APIs for an entity
 */
export const EntityProvidedApisCard = (props: EntityProvidedApisCardProps) => {
  const {
    variant = 'gridItem',
    title = 'Provided APIs',
    columns = apiEntityColumns,
    tableOptions = {},
  } = props;
  const { entity } = useEntity();
  const { entities, loading, error } = useRelatedEntities(entity, {
    type: RELATION_PROVIDES_API,
  });

  if (loading) {
    return (
      <InfoCard variant={variant} title={title}>
        <Progress />
      </InfoCard>
    );
  }

  if (error || !entities) {
    return (
      <InfoCard variant={variant} title={title}>
        <WarningPanel
          severity="error"
          title="Could not load APIs"
          message={<CodeSnippet text={`${error}`} language="text" />}
        />
      </InfoCard>
    );
  }

  return (
    <EntityTable
      title={title}
      variant={variant}
      emptyContent={
        <div style={{ textAlign: 'center' }}>
          <Typography variant="body1">
            This {entity.kind.toLocaleLowerCase('en-US')} does not provide any
            APIs.
          </Typography>
          <Typography variant="body2">
            <Link
              to="https://backstage.io/docs/features/software-catalog/descriptor-format#specprovidesapis-optional"
              externalLinkIcon
            >
              Learn how to change this
            </Link>
          </Typography>
        </div>
      }
      columns={columns}
      tableOptions={tableOptions}
      entities={entities as ApiEntity[]}
    />
  );
};
      