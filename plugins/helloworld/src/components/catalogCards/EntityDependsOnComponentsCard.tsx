
/* <ai_context>
Component that displays components an entity depends on, migrated to MUI 5.
Removed title and variant usage, no table title.
</ai_context> */

import { RELATION_DEPENDS_ON, ComponentEntity } from '@backstage/catalog-model';
import {
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

export interface EntityDependsOnComponentsCardProps {
  columns?: TableColumn<ComponentEntity>[];
  tableOptions?: TableOptions;
}

/**
 * Component showing components that the entity depends on
 */
export function EntityDependsOnComponentsCard(props: EntityDependsOnComponentsCardProps) {
  const {
    columns = componentEntityColumns,
    tableOptions = {},
  } = props;
  
  return (
    <EntityRelatedEntitiesCard
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
