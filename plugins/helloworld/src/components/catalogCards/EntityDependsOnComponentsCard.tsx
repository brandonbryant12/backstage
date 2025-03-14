
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

export function EntityDependsOnComponentsCard(props: {
  columns?: TableColumn<ComponentEntity>[];
  tableOptions?: TableOptions;
}) {
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
      