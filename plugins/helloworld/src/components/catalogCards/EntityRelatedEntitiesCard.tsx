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
} from '@backstage/core-components';

export const EntityRelatedEntitiesCard = (props: {
  relationType: string;
  entityKind?: string;
  emptyMessage: string;
}) => {
  const {
    relationType,
    entityKind,
    emptyMessage,
  } = props;

  const columns = [
    EntityTable.columns.createEntityRefColumn(),
    EntityTable.columns.createOwnerColumn(),
    EntityTable.columns.createSpecTypeColumn(),
    EntityTable.columns.createSpecLifecycleColumn(),
    EntityTable.columns.createMetadataDescriptionColumn(),
  ];

  const emptyHelpLink =  'https://backstage.io/docs/features/software-catalog/descriptor-format';
  
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
      />
    </InfoCard>
  );
};