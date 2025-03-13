
/* <ai_context>
Component that displays components an entity depends on, migrated to MUI 5.
</ai_context> */

import { RELATION_DEPENDS_ON, ComponentEntity } from '@backstage/catalog-model';
import {
  InfoCardVariants,
  TableColumn,
  TableOptions,
} from '@backstage/core-components';
import React from 'react';
import {
  asComponentEntities,
  componentEntityColumns,
  componentEntityHelpLink,
} from './presets';
import { EntityRelatedEntitiesCard } from './EntityRelatedEntitiesCard';

/**
 * Props for EntityDependsOnComponentsCard
 */
export interface EntityDependsOnComponentsCardProps {
  variant?: InfoCardVariants;
  title?: string;
  columns?: TableColumn<ComponentEntity>[];
  tableOptions?: TableOptions;
}

/**
 * Component showing components that the entity depends on
 */
export function EntityDependsOnComponentsCard(props: EntityDependsOnComponentsCardProps) {
  const {
    variant = 'gridItem',
    title = 'Depends on components',
    columns = componentEntityColumns,
    tableOptions = {},
  } = props;
  
  return (
    <EntityRelatedEntitiesCard
      variant={variant}
      title={title}
      entityKind="Component"
      relationType={RELATION_DEPENDS_ON}
      columns={columns}
      emptyMessage="No component is a dependency of this component"
      emptyHelpLink={componentEntityHelpLink}
      asRenderableEntities={asComponentEntities}
      tableOptions={tableOptions}
    />
  );
}
      