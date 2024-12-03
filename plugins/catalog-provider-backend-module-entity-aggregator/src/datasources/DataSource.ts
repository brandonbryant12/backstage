import { LoggerService } from '@backstage/backend-plugin-api';
import { Entity } from '@backstage/catalog-model';
import { SchedulerService } from '@backstage/backend-plugin-api';

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
  protected readonly scheduler: SchedulerService;

  constructor(
    config: DataSourceConfig, 
    logger: LoggerService,
    scheduler: SchedulerService,
  ) {
    this.config = config;
    this.logger = logger.child({ datasource: config.name });
    this.scheduler = scheduler;
  }

  async initialize(): Promise<void> {
    if (this.config.refreshSchedule) {
      try {
        await this.scheduler.scheduleTask({
          id: `datasource-refresh-${this.config.name}`,
          frequency: { cron: this.config.refreshSchedule },
          timeout: { minutes: 10 },
          fn: async () => {
            this.logger.info('Starting scheduled refresh');
            try {
              const entities = await this.fetchEntities();
              if (this.onEntitiesFetched) {
                await this.onEntitiesFetched(entities);
              }
            } catch (error) {
              const dataSourceError: DataSourceError = {
                message: `Failed to refresh entities for ${this.config.name}`,
                cause: error instanceof Error ? error : new Error(String(error)),
              };
              this.logger.error(dataSourceError.message, error);
              throw dataSourceError;
            }
          },
        });
        this.logger.info(`Scheduled refresh with cron: ${this.config.refreshSchedule}`);
      } catch (error) {
        const schedulingError: DataSourceError = {
          message: `Failed to schedule refresh for ${this.config.name}`,
          cause: error instanceof Error ? error : new Error(String(error)),
        };
        this.logger.error(schedulingError.message, error);
        throw schedulingError;
      }
    }
  }

  getName(): string {
    return this.config.name;
  }

  getPriority(): number {
    return this.config.priority;
  }

  abstract fetchEntities(): Promise<Entity[]>;

  onEntitiesFetched?: (entities: Entity[]) => Promise<void>;
}