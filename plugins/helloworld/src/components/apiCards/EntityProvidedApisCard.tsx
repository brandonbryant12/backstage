
import { ApiEntity, RELATION_PROVIDES_API } from '@backstage/catalog-model';
import React from 'react';
import { EntityApiRelationshipCard } from './EntityApiRelationshipCard';
import { TableColumn, TableOptions } from '@backstage/core-components';
import { apiEntityColumns } from './presets';


export const EntityProvidedApisCard = (props: {
  columns?: TableColumn<ApiEntity>[];
  tableOptions?: TableOptions;
}) => {
  const {
    columns = apiEntityColumns,
    tableOptions = {},
  } = props;
  
  return (
    <EntityApiRelationshipCard
      relationType={RELATION_PROVIDES_API}
      columns={columns}
      emptyMessage="This entity does not provide any APIs"
      emptyHelpLink="https://backstage.io/docs/features/software-catalog/descriptor-format#kind-api"
      tableOptions={tableOptions}
    />
  );
};
      