
/* <ai_context>
Component that displays resources an entity depends on, migrated to MUI 5.
</ai_context> */

import { RELATION_DEPENDS_ON, ResourceEntity } from '@backstage/catalog-model';
import {
  InfoCardVariants,
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

/**
 * Props for EntityDependsOnResourcesCard
 */
export interface EntityDependsOnResourcesCardProps {
  variant?: InfoCardVariants;
  title?: string;
  columns?: TableColumn<ResourceEntity>[];
  tableOptions?: TableOptions;
}

/**
 * Component showing resources that the entity depends on
 */
export function EntityDependsOnResourcesCard(props: EntityDependsOnResourcesCardProps) {
  const {
    variant = 'gridItem',
    title = 'Depends on resources',
    columns = resourceEntityColumns,
    tableOptions = {},
  } = props;
  
  return (
    <EntityRelatedEntitiesCard
      variant={variant}
      title={title}
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
      