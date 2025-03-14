
import { ApiEntity, RELATION_CONSUMES_API } from '@backstage/catalog-model';
import React from 'react';
import { EntityApiRelationshipCard } from './EntityApiRelationshipCard';
import { TableColumn, TableOptions } from '@backstage/core-components';
import { apiEntityColumns } from './presets';

export const EntityConsumedApisCard = (props: {
  columns?: TableColumn<ApiEntity>[];
  tableOptions?: TableOptions;
}) => {
  const {
    columns = apiEntityColumns,
    tableOptions = {},
  } = props;
  
  return (
    <EntityApiRelationshipCard
      relationType={RELATION_CONSUMES_API}
      columns={columns}
      emptyMessage="This entity does not consume any APIs"
      emptyHelpLink="https://backstage.io/docs/features/software-catalog/descriptor-format#kind-api"
      tableOptions={tableOptions}
    />
  );
};
      