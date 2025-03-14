
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

export function EntityHasSubcomponentsCard(props: {
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
      relationType={RELATION_HAS_PART}
      columns={columns}
      asRenderableEntities={asComponentEntities}
      emptyMessage="No subcomponent is part of this component"
      emptyHelpLink="https://backstage.io/docs/features/software-catalog/descriptor-format#specsubcomponentof-optional"
      tableOptions={tableOptions}
    />
  );
}
      