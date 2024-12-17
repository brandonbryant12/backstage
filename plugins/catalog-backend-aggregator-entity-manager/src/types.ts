import { EntityMeta } from '@backstage/catalog-model';
import { JsonObject } from '@backstage/types';

export interface EntityRecord {
  dataSource: string;
  entityRef: string;
  metadata: EntityMeta & {
    annotations?: Record<string, string>;
  };
  spec: JsonObject;
  priorityScore: number;
  expirationDate?: Date;
  contentHash?: string;
  updated?: boolean;
}