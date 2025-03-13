
/* <ai_context>
Base component for various entity relationship cards, migrated to MUI 5.
</ai_context> */

import { Entity } from '@backstage/catalog-model';
import { Typography } from '@mui/material';
import {
  useEntity,
  useRelatedEntities,
} from '@backstage/plugin-catalog-react';
import React from 'react';
import { EntityTable } from '../apiCards/EntityTable';
import {
  InfoCard,
  InfoCardVariants,
  Link,
  Progress,
  ResponseErrorPanel,
  TableColumn,
  TableOptions,
} from '@backstage/core-components';
import {
  asComponentEntities,
  asResourceEntities,
  asSystemEntities,
  componentEntityColumns,
  componentEntityHelpLink,
  resourceEntityColumns,
  resourceEntityHelpLink,
  systemEntityColumns,
  systemEntityHelpLink,
} from './presets';

/**
 * Props for EntityRelatedEntitiesCard
 */
export interface EntityRelatedEntitiesCardProps<T extends Entity> {
  variant?: InfoCardVariants;
  title: string;
  columns: TableColumn<T>[];
  entityKind?: string;
  relationType: string;
  emptyMessage: string;
  emptyHelpLink: string;
  asRenderableEntities: (entities: Entity[]) => T[];
  tableOptions?: TableOptions;
}

/**
 * A low level card component for building entity relationship cards
 */
export const EntityRelatedEntitiesCard = <T extends Entity>(
  props: EntityRelatedEntitiesCardProps<T>,
) => {
  const {
    variant = 'gridItem',
    title,
    columns,
    entityKind,
    relationType,
    emptyMessage,
    emptyHelpLink,
    asRenderableEntities,
    tableOptions = {},
  } = props;
  
  const { entity } = useEntity();
  const { entities, loading, error } = useRelatedEntities(entity, {
    type: relationType,
    kind: entityKind,
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

  return (
    <EntityTable
      title={title}
      variant={variant}
      emptyContent={
        <div style={{ textAlign: 'center' }}>
          <Typography variant="body1">{emptyMessage}</Typography>
          <Typography variant="body2">
            <Link to={emptyHelpLink} externalLinkIcon>
              Learn how to change this
            </Link>
          </Typography>
        </div>
      }
      columns={columns}
      entities={asRenderableEntities(entities || [])}
      tableOptions={tableOptions}
    />
  );
};

// Static properties for ease of use
EntityRelatedEntitiesCard.componentEntityColumns = componentEntityColumns;
EntityRelatedEntitiesCard.componentEntityHelpLink = componentEntityHelpLink;
EntityRelatedEntitiesCard.asComponentEntities = asComponentEntities;
EntityRelatedEntitiesCard.resourceEntityColumns = resourceEntityColumns;
EntityRelatedEntitiesCard.resourceEntityHelpLink = resourceEntityHelpLink;
EntityRelatedEntitiesCard.asResourceEntities = asResourceEntities;
EntityRelatedEntitiesCard.systemEntityColumns = systemEntityColumns;
EntityRelatedEntitiesCard.systemEntityHelpLink = systemEntityHelpLink;
EntityRelatedEntitiesCard.asSystemEntities = asSystemEntities;
      