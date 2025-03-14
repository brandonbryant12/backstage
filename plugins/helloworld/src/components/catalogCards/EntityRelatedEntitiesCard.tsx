
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

interface EntityRelatedEntitiesCardProps<T extends Entity> {
  relationType: string;
  entityKind?: string;
  columns: TableColumn<T>[];
  emptyMessage: string;
  emptyHelpLink: string;
  asRenderableEntities: (entities: Entity[]) => T[];
  tableOptions?: TableOptions;
}

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
      