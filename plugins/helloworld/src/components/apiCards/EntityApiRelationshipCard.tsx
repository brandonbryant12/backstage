
import React from 'react';
import { useEntity, useRelatedEntities } from '@backstage/plugin-catalog-react';
import { ApiEntity } from '@backstage/catalog-model';
import {
  InfoCard,
  Link,
  Progress,
  ResponseErrorPanel,
} from '@backstage/core-components';
import { Typography } from '@mui/material';
import { EntityTable } from './EntityTable';

export function EntityApiRelationshipCard(props: {
  relationType: string;
  emptyMessage?: string;
}) {
  const {
    relationType,
    emptyMessage = 'No APIs found for this relationship',
  } = props;

  const emptyHelpLink = "https://backstage.io/docs/features/software-catalog/descriptor-format"
  const { entity } = useEntity();
  const { entities, loading, error } = useRelatedEntities(entity, {
    type: relationType,
    kind: 'API',
  });

  const columns = [
    EntityTable.columns.createEntityRefColumn(),
    EntityTable.columns.createOwnerColumn(),
    EntityTable.columns.createSpecTypeColumn(),
    EntityTable.columns.createSpecLifecycleColumn(),
    EntityTable.columns.createMetadataDescriptionColumn(),
  ];

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
        entities={entities as ApiEntity[]}
        columns={columns}
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
      />
    </InfoCard>
  );
}
      