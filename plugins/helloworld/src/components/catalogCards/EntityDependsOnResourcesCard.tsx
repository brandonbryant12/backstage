
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

export function EntityDependsOnResourcesCard(props: {
  columns?: TableColumn<ResourceEntity>[];
  tableOptions?: TableOptions;
}) {
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
      