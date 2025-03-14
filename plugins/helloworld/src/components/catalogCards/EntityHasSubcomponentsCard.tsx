
/* <ai_context>
Component that displays subcomponents of an entity, migrated to MUI 5.
Removed title and variant usage, no table title.
</ai_context> */

import { ComponentEntity, RELATION_HAS_PART } from '@backstage/catalog-model';
import {
  TableColumn,
  TableOptions,
} from '@backstage/core-components';
import React from 'react';
import {
  asComponentEntities,
  componentEntityColumns,
} from './presets';
import { EntityRelatedEntitiesCard } from './EntityRelatedEntitiesCard';

export interface EntityHasSubcomponentsCardProps {
  columns?: TableColumn<ComponentEntity>[];
  tableOptions?: TableOptions;
}

/**
 * Component showing subcomponents that are part of the entity
 */
export function EntityHasSubcomponentsCard(props: EntityHasSubcomponentsCardProps) {
  const {
    columns = componentEntityColumns,
    tableOptions = {},
  } = props;
  
  return (
    <EntityRelatedEntitiesCard
      entityKind="Component"
      relationType={RELATION_HAS_PART}
      columns={columns}
      asRenderableEntities={asComponentEntities}
      emptyMessage="No subcomponent is part of this component"
      emptyHelpLink="https://backstage.io/docs/features/software-catalog/descriptor-format#specsubcomponentof-optional"
      tableOptions={tableOptions}
    />
  );
}
