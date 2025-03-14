
import { RELATION_HAS_PART } from '@backstage/catalog-model';
import {
  TableColumn,
  TableOptions,
} from '@backstage/core-components';
import React from 'react';
import { EntityRelatedEntitiesCard } from './EntityRelatedEntitiesCard';

export function EntityHasSubcomponentsCard(props: {
  columns?: TableColumn<any>[];
  tableOptions?: TableOptions;
}) {
  const {
    columns,
    tableOptions = {},
  } = props;
  
  return (
    <EntityRelatedEntitiesCard
      entityKind="Component"
      relationType={RELATION_HAS_PART}
      columns={columns}
      emptyMessage="No subcomponent is part of this component"
      tableOptions={tableOptions}
    />
  );
}
      