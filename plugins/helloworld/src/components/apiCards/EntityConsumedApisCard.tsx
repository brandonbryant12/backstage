
/* <ai_context>
Component that displays APIs consumed by an entity, using the generic EntityApiRelationshipCard.
Removed title and variant usage.
</ai_context> */

import { ApiEntity, RELATION_CONSUMES_API } from '@backstage/catalog-model';
import React from 'react';
import { EntityApiRelationshipCard } from './EntityApiRelationshipCard';
import { TableColumn, TableOptions } from '@backstage/core-components';
import { apiEntityColumns } from './presets';

export interface EntityConsumedApisCardProps {
  columns?: TableColumn<ApiEntity>[];
  tableOptions?: TableOptions;
}

/**
 * Component showing consumed APIs for an entity
 * Removed explicit title usage; no InfoCard variant.
 */
export const EntityConsumedApisCard = (props: EntityConsumedApisCardProps) => {
  const {
    columns = apiEntityColumns,
    tableOptions = {},
  } = props;
  
  return (
    <EntityApiRelationshipCard
      relationType={RELATION_CONSUMES_API}
      columns={columns}
      emptyMessage="This entity does not consume any APIs"
      emptyHelpLink="https://backstage.io/docs/features/software-catalog/descriptor-format#kind-api"
      tableOptions={tableOptions}
    />
  );
};
