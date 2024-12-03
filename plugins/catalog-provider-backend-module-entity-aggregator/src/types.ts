import { EntityMeta } from '@backstage/catalog-model';
import { JsonObject } from '@backstage/types';

export interface EntityRecord {
  dataSource: string;
  entityRef: string;
  metadata: EntityMeta;
  spec: JsonObject;
  priorityScore: number;
  expirationDate?: Date;
}