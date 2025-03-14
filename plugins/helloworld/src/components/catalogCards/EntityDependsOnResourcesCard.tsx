
/* <ai_context>
Component that displays resources an entity depends on, migrated to MUI 5.
Removed title and variant usage, no table title.
</ai_context> */

import { RELATION_DEPENDS_ON, ResourceEntity } from '@backstage/catalog-model';
import {
  TableColumn,
  TableOptions,
} from '@backstage/core-components';
import React from 'react';
import {
  asResourceEntities,
  componentEntityHelpLink,
  resourceEntityColumns,
} from './presets';
import { EntityRelatedEntitiesCard } from './EntityRelatedEntitiesCard';

export interface EntityDependsOnResourcesCardProps {
  columns?: TableColumn<ResourceEntity>[];
  tableOptions?: TableOptions;
}

/**
 * Component showing resources that the entity depends on
 */
export function EntityDependsOnResourcesCard(props: EntityDependsOnResourcesCardProps) {
  const {
    columns = resourceEntityColumns,
    tableOptions = {},
  } = props;
  
  return (
    <EntityRelatedEntitiesCard
      entityKind="Resource"
      relationType={RELATION_DEPENDS_ON}
      columns={columns}
      emptyMessage="No resource is a dependency of this component"
      emptyHelpLink={componentEntityHelpLink}
      asRenderableEntities={asResourceEntities}
      tableOptions={tableOptions}
    />
  );
}
