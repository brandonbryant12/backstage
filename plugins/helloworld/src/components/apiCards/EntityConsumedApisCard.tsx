
/* <ai_context>
Component that displays APIs consumed by an entity, using the generic EntityApiRelationshipCard
</ai_context> */

import { ApiEntity, RELATION_CONSUMES_API } from '@backstage/catalog-model';
import React from 'react';
import { EntityApiRelationshipCard } from './EntityApiRelationshipCard';
import {
  InfoCardVariants,
  TableColumn,
  TableOptions,
} from '@backstage/core-components';
import { apiEntityColumns } from './presets';

/**
 * Props for EntityConsumedApisCard
 */
export interface EntityConsumedApisCardProps {
  variant?: InfoCardVariants;
  title?: string;
  columns?: TableColumn<ApiEntity>[];
  tableOptions?: TableOptions;
}

/**
 * Component showing consumed APIs for an entity
 */
export const EntityConsumedApisCard = (props: EntityConsumedApisCardProps) => {
  const {
    variant,
    title = 'Consumed APIs',
    columns = apiEntityColumns,
    tableOptions = {},
  } = props;
  
  return (
    <EntityApiRelationshipCard
      variant={variant}
      title={title}
      relationType={RELATION_CONSUMES_API}
      columns={columns}
      tableOptions={tableOptions}
    />
  );
};
