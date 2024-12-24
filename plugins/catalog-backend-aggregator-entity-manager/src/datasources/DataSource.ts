import { LoggerService, SchedulerServiceTaskScheduleDefinition } from '@backstage/backend-plugin-api';
import { Entity } from '@backstage/catalog-model';

export interface DataSourceConfig {
  name: string;
  priority: number;
  refreshSchedule?: SchedulerServiceTaskScheduleDefinition;
  ttlSeconds?: number;
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
    this.logger = logger;
  }

  public getConfig(): DataSourceConfig {
    return this.config;
  }

  getName(): string {
    return this.config.name;
  }

  getPriority(): number {
    return this.config.priority;
  }

  getSchedule(): SchedulerServiceTaskScheduleDefinition | undefined {
    return this.config.refreshSchedule;
  }

  /**
   * Implement this method to fetch entities from your data source.
   * Use the provided callback to send entities to the aggregator.
   * The callback can be called multiple times if needed.
   */
  abstract refresh(provide: (entities: Entity[]) => Promise<void>): Promise<void>;
}