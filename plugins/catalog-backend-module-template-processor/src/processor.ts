import { CatalogProcessor } from '@backstage/plugin-catalog-node';
import { Entity } from '@backstage/catalog-model';
import { timestampEntity } from '@internal/processor-common';
import { CatalogClient } from '@backstage/catalog-client';
import { LoggerService } from '@backstage/backend-plugin-api';

export class TemplateTimestampProcessor implements CatalogProcessor {
  private catalogClient: CatalogClient;
  private logger: LoggerService;

  constructor(catalogClient: CatalogClient, logger: LoggerService) {
    this.catalogClient = catalogClient;
    this.logger = logger;
  }

  getProcessorName(): string {
    return 'TemplateTimestampProcessor';
  }

  async preProcessEntity(entity: Entity): Promise<Entity> {
    if (entity.kind === 'Template') {
      this.logger.debug(
        `Applying timestampEntity to Template kind: '${entity.metadata.name}' in namespace '${entity.metadata.namespace}'`,
      );
      const timestamped = await timestampEntity(
        entity,
        this.catalogClient,
        this.logger,
      );
      return timestamped;
    }
    return entity;
  }
}