
import { ComponentEntity } from '@backstage/catalog-model';
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

interface EntityRelatedEntitiesCardProps {
  relationType: string;
  columns?: TableColumn<ComponentEntity>[];
  emptyMessage: string;
  emptyHelpLink?: string;
  tableOptions?: TableOptions;
}

function getColumnsForComponent(): TableColumn<ComponentEntity>[] {
  return [
    EntityTable.columns.createEntityRefColumn({ defaultKind: 'component' }),
    EntityTable.columns.createOwnerColumn(),
    EntityTable.columns.createSpecTypeColumn(),
    EntityTable.columns.createSpecLifecycleColumn(),
    EntityTable.columns.createMetadataDescriptionColumn(),
  ];
}

export const EntityRelatedEntitiesCard = (props: EntityRelatedEntitiesCardProps) => {
  const {
    relationType,
    columns = getColumnsForComponent(),
    emptyMessage,
    emptyHelpLink = 'https://backstage.io/docs/features/software-catalog/descriptor-format',
    tableOptions = {},
  } = props;
  
  const { entity } = useEntity();
  const { entities, loading, error } = useRelatedEntities(entity, {
    type: relationType,
    kind: 'Component',
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

  const typedEntities = (entities || []) as ComponentEntity[];

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
      