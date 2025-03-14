
import { Entity, ComponentEntity, ResourceEntity, SystemEntity } from '@backstage/catalog-model';
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
  columns?: TableColumn<T>[];
  emptyMessage: string;
  emptyHelpLink?: string;
  tableOptions?: TableOptions;
}

function getColumnsForKind<T extends Entity>(kind: string | undefined): TableColumn<T>[] {
  switch (kind) {
    case 'Component':
      return [
        EntityTable.columns.createEntityRefColumn({ defaultKind: 'component' }),
        EntityTable.columns.createOwnerColumn(),
        EntityTable.columns.createSpecTypeColumn(),
        EntityTable.columns.createSpecLifecycleColumn(),
        EntityTable.columns.createMetadataDescriptionColumn(),
      ] as TableColumn<T>[];
    default:
      return [
        EntityTable.columns.createEntityRefColumn({ defaultKind: kind || 'entity' }),
        EntityTable.columns.createOwnerColumn(),
        EntityTable.columns.createMetadataDescriptionColumn(),
      ] as TableColumn<T>[];
  }
}

export const EntityRelatedEntitiesCard = <T extends Entity>(
  props: EntityRelatedEntitiesCardProps<T>,
) => {
  const {
    relationType,
    entityKind,
    columns = getColumnsForKind(entityKind) as TableColumn<T>[],
    emptyMessage,
    emptyHelpLink = 'https://backstage.io/docs/features/software-catalog/descriptor-format',
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

  // Type assertion based on entityKind
  let typedEntities: T[];
  switch (entityKind) {
    case 'Component':
      typedEntities = (entities || []) as ComponentEntity[] as T[];
      break;
    case 'Resource':
      typedEntities = (entities || []) as ResourceEntity[] as T[];
      break;
    case 'System':
      typedEntities = (entities || []) as SystemEntity[] as T[];
      break;
    default:
      typedEntities = (entities || []) as T[];
  }

  return (
    <InfoCard>
      <EntityTable
        entities={typedEntities}
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
      