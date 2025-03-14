
import { ComponentEntity, SystemEntity } from '@backstage/catalog-model';
import { TableColumn } from '@backstage/core-components';
import { columnFactories } from './columns';

export const systemEntityColumns: TableColumn<SystemEntity>[] = [
  columnFactories.createEntityRefColumn({ defaultKind: 'system' }),
  columnFactories.createDomainColumn(),
  columnFactories.createOwnerColumn(),
  columnFactories.createMetadataDescriptionColumn(),
];

export const componentEntityColumns: TableColumn<ComponentEntity>[] = [
  columnFactories.createEntityRefColumn({ defaultKind: 'component' }),
  columnFactories.createSystemColumn(),
  columnFactories.createOwnerColumn(),
  columnFactories.createSpecTypeColumn(),
  columnFactories.createSpecLifecycleColumn(),
  columnFactories.createMetadataDescriptionColumn(),
];
      