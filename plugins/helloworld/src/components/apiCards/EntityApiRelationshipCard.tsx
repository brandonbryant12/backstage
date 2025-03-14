
import React from 'react';
import { useEntity, useRelatedEntities } from '@backstage/plugin-catalog-react';
import { ApiEntity } from '@backstage/catalog-model';
import {
  InfoCard,
  Link,
  Progress,
  ResponseErrorPanel,
  TableColumn,
  TableOptions,
} from '@backstage/core-components';
import { Typography } from '@mui/material';
import { EntityTable } from './EntityTable';

interface EntityApiRelationshipCardProps {
  relationType: string;
  columns: TableColumn<ApiEntity>[];
  emptyMessage?: string;
  emptyHelpLink?: string;
  tableOptions?: TableOptions;
}

/**
 * Generic card to display either consumed or provided APIs for an entity.
 * Removed InfoCard title and variant. No table title is used.
 */
export function EntityApiRelationshipCard(props: EntityApiRelationshipCardProps) {
  const {
    relationType,
    columns,
    emptyMessage = 'No APIs found for this relationship',
    emptyHelpLink = 'https://backstage.io',
    tableOptions = {},
  } = props;

  const { entity } = useEntity();
  const { entities, loading, error } = useRelatedEntities(entity, {
    type: relationType,
    kind: 'API',
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
        tableOptions={tableOptions}
      />
    </InfoCard>
  );
}
      