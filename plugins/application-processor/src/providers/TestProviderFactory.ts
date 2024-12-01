import { 
  LoggerService,
  SchedulerService,
} from '@backstage/backend-plugin-api';
import { Entity } from '@backstage/catalog-model';
import { TestProvider } from './TestProvider';

export interface TestProviderOptions {
  /** Provider name suffix to distinguish between instances */
  name: string;
  /** Cron expression for scheduling provider runs */
  cron: string;
  /** Initial set of mock entities */
  mockEntities: Entity[];
  /** Additional annotations to add to all entities */
  annotations?: Record<string, string>;
}

export class TestProviderFactory {
  private constructor(
    private readonly logger: LoggerService,
    private readonly scheduler: SchedulerService,
  ) {}

  static create(options: {
    logger: LoggerService;
    scheduler: SchedulerService;
  }): TestProviderFactory {
    return new TestProviderFactory(options.logger, options.scheduler);
  }

  createProvider(options: TestProviderOptions): TestProvider {
    this.logger.info(`Creating test provider: ${options.name}`);
    
    return new TestProvider(
      {
        name: options.name,
        entities: options.mockEntities,
        annotations: options.annotations,
        cron: options.cron,
      },
      this.logger,
      this.scheduler,
    );
  }
}