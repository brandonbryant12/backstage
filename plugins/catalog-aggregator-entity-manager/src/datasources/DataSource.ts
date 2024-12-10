import { LoggerService } from '@backstage/backend-plugin-api';
import { Entity } from '@backstage/catalog-model';
import { SchedulerServiceTaskScheduleDefinition } from '@backstage/backend-plugin-api';

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
    this.logger = logger.child({ datasource: config.name });
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

  public getExpirationDate(): Date | undefined {
    if (!this.config.ttlSeconds) {
      return undefined;
    }
    const expirationDate = new Date();
    expirationDate.setSeconds(expirationDate.getSeconds() + this.config.ttlSeconds);
    return expirationDate;
  }

  abstract refresh(provide: (entities: Entity[]) => Promise<void>): Promise<void>;
}