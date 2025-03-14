
/* <ai_context>
Base component for various entity relationship cards, migrated to MUI 5. 
Now removing InfoCard title, variant usage, and not passing any title to the table.
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
  Link,
  Progress,
  ResponseErrorPanel,
  TableColumn,
  TableOptions,
} from '@backstage/core-components';

/**
 * Props for EntityRelatedEntitiesCard
 */
export interface EntityRelatedEntitiesCardProps<T extends Entity> {
  /**
   * (Removed the usage of title for the table.)
   */
  relationType: string;
  entityKind?: string;
  columns: TableColumn<T>[];
  emptyMessage: string;
  emptyHelpLink: string;
  asRenderableEntities: (entities: Entity[]) => T[];
  tableOptions?: TableOptions;
}

/**
 * A low level card component for building entity relationship cards
 * No longer displays a title or variant on the InfoCard, and table has no title.
 */
export const EntityRelatedEntitiesCard = <T extends Entity>(
  props: EntityRelatedEntitiesCardProps<T>,
) => {
  const {
    relationType,
    entityKind,
    columns,
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
      <InfoCard>
        <Progress />
      </InfoCard>
    );
  }

  if (error) {
    return (
      <InfoCard>
        <ResponseErrorPanel error={error} />
      </InfoCard>
    );
  }

  return (
    <InfoCard>
      <EntityTable
        entities={asRenderableEntities(entities || [])}
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
        tableOptions={tableOptions}
      />
    </InfoCard>
  );
};
