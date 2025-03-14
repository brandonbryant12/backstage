
/* <ai_context>
A generic component for displaying API relationships (both consumed and provided)
</ai_context> */

import { ApiEntity } from '@backstage/catalog-model';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
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
 * Props for EntityApiRelationshipCard
 */
export interface EntityApiRelationshipCardProps {
  variant?: InfoCardVariants;
  title: string;
  relationType: string;
  columns?: TableColumn<ApiEntity>[];
  tableOptions?: TableOptions;
  emptyMessage?: string;
  emptyHelpLink?: string;
}

/**
 * Generic component for displaying API relationships
 */
export const EntityApiRelationshipCard = (props: EntityApiRelationshipCardProps) => {
  const {
    variant = 'gridItem',
    title,
    relationType,
    columns = apiEntityColumns,
    tableOptions = {},
    emptyMessage,
    emptyHelpLink,
  } = props;
  
  const { entity } = useEntity();
  const { entities, loading, error } = useRelatedEntities(entity, {
    type: relationType,
  });

  // Default empty state content based on entity kind and type
  const defaultEmptyMessage = `This ${entity.kind.toLocaleLowerCase('en-US')} does not ${
    relationType.includes('consumes') ? 'consume' : 'provide'
  } any APIs.`;

  // Default help link based on relation type
  const defaultHelpLink = relationType.includes('consumes')
    ? 'https://backstage.io/docs/features/software-catalog/descriptor-format#specconsumesapis-optional'
    : 'https://backstage.io/docs/features/software-catalog/descriptor-format#specprovidesapis-optional';

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
            {emptyMessage || defaultEmptyMessage}
          </Typography>
          <Typography variant="body2">
            <Link
              to={emptyHelpLink || defaultHelpLink}
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
