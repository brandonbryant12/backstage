
/* <ai_context>
Component that displays APIs provided by an entity, using the generic EntityApiRelationshipCard
</ai_context> */

import { ApiEntity, RELATION_PROVIDES_API } from '@backstage/catalog-model';
import React from 'react';
import { EntityApiRelationshipCard } from './EntityApiRelationshipCard';
import {
  InfoCardVariants,
  TableColumn,
  TableOptions,
} from '@backstage/core-components';
import { apiEntityColumns } from './presets';

/**
 * Props for EntityProvidedApisCard
 */
export interface EntityProvidedApisCardProps {
  variant?: InfoCardVariants;
  title?: string;
  columns?: TableColumn<ApiEntity>[];
  tableOptions?: TableOptions;
}

/**
 * Component showing provided APIs for an entity
 */
export const EntityProvidedApisCard = (props: EntityProvidedApisCardProps) => {
  const {
    variant,
    title = 'Provided APIs',
    columns = apiEntityColumns,
    tableOptions = {},
  } = props;
  
  return (
    <EntityApiRelationshipCard
      variant={variant}
      title={title}
      relationType={RELATION_PROVIDES_API}
      columns={columns}
      tableOptions={tableOptions}
    />
  );
};
