import { EntityMeta } from '@backstage/catalog-model';

export interface EntityRecord {
  dataSource: string;
  entityRef: string;
  metadata: EntityMeta & {
    annotations?: Record<string, string>;
  };
  spec: Record<string, any>;
  priorityScore: number;
  expirationDate?: Date;
  contentHash?: string;
  updated?: boolean;
}