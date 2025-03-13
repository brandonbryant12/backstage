
/* <ai_context>
Component that displays APIs consumed by an entity, migrated to MUI 5.
</ai_context> */

import { ApiEntity, RELATION_CONSUMES_API } from '@backstage/catalog-model';
import Typography from '@mui/material/Typography';
import {
  useEntity,
  useRelatedEntities,
} from '@backstage/plugin-catalog-react';
import React from 'react';
import { apiEntityColumns } from './presets';
import { EntityTable } from './EntityTable';
import Box from '@mui/material/Box'
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
 * Props for EntityConsumedApisCard
 */
export interface EntityConsumedApisCardProps {
  variant?: InfoCardVariants;
  title?: string;
  columns?: TableColumn<ApiEntity>[];
  tableOptions?: TableOptions;
}

/**
 * Component showing consumed APIs for an entity
 */
export const EntityConsumedApisCard = (props: EntityConsumedApisCardProps) => {
  const {
    variant = 'gridItem',
    title = 'Consumed APIs',
    columns = apiEntityColumns,
    tableOptions = {},
  } = props;
  const { entity } = useEntity();
  const { entities, loading, error } = useRelatedEntities(entity, {
    type: RELATION_CONSUMES_API,
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
        <Box style={{ textAlign: 'center' }}>
          <Typography variant="body1">
            This {entity.kind.toLocaleLowerCase('en-US')} does not consume any
            APIs.
          </Typography>
          <Typography variant="body2">
            <Link
              to="https://backstage.io/docs/features/software-catalog/descriptor-format#specconsumesapis-optional"
              externalLinkIcon
            >
              Learn how to change this
            </Link>
          </Typography>
        </Box>
      }
      columns={columns}
      tableOptions={tableOptions}
      entities={entities as ApiEntity[]}
    />
  );
};
      