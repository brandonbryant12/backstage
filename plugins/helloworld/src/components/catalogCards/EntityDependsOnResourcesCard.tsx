
import { RELATION_DEPENDS_ON } from '@backstage/catalog-model';
import {
  TableColumn,
  TableOptions,
} from '@backstage/core-components';
import React from 'react';
import { EntityRelatedEntitiesCard } from './EntityRelatedEntitiesCard';

export function EntityDependsOnResourcesCard(props: {
  columns?: TableColumn<any>[];
  tableOptions?: TableOptions;
}) {
  const {
    columns,
    tableOptions = {},
  } = props;
  
  return (
    <EntityRelatedEntitiesCard
      entityKind="Resource"
      relationType={RELATION_DEPENDS_ON}
      columns={columns}
      emptyMessage="No resource is a dependency of this component"
      tableOptions={tableOptions}
    />
  );
}
      