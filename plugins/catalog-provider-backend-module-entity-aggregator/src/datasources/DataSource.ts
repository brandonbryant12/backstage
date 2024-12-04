import { LoggerService } from '@backstage/backend-plugin-api';
import { Entity } from '@backstage/catalog-model';

export interface DataSourceConfig {
  name: string;
  priority: number;
  refreshSchedule?: string;
}

export type DataSourceError = {
  message: string;
  cause?: Error;
};

export abstract class DataSource {
  protected readonly logger: LoggerService;
  protected readonly config: DataSourceConfig;

  constructor(
    config: DataSourceConfig, 
    logger: LoggerService,
  ) {
    this.config = config;
    this.logger = logger.child({ datasource: config.name });
  }

  getName(): string {
    return this.config.name;
  }

  getPriority(): number {
    return this.config.priority;
  }

  getSchedule(): string | undefined {
    return this.config.refreshSchedule;
  }

  abstract refresh(provide: (entities: Entity[]) => Promise<void>): Promise<void>;
}