
import { ApiEntity } from '@backstage/catalog-model';
import { EntityTable } from './EntityTable';
import { TableColumn } from '@backstage/core-components';

export const apiEntityColumns: TableColumn<ApiEntity>[] = [
  EntityTable.columns.createEntityRefColumn({ defaultKind: 'api' }),
  EntityTable.columns.createOwnerColumn(),
  EntityTable.columns.createSpecTypeColumn(),
  EntityTable.columns.createSpecLifecycleColumn(),
  EntityTable.columns.createMetadataDescriptionColumn(),
];
      