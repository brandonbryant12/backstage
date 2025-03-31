import { LoggerService, SchedulerService } from '@backstage/backend-plugin-api';
import { EntriesRepository, TechRadarEntry } from '../repository/entriesRepository';

export interface AbstractTechRadarDataServiceOptions {
  logger: LoggerService;
  repository: EntriesRepository;
  scheduler: SchedulerService;
}

export abstract class AbstractTechRadarDataService {
  protected readonly logger: LoggerService;
  protected readonly repository: EntriesRepository;
  protected readonly scheduler: SchedulerService;
  private readonly taskId: string = 'tech-radar-data-refresh';
  private readonly taskFrequency = { days: 1 };

  protected constructor(options: AbstractTechRadarDataServiceOptions) {
    this.logger = options.logger.child({ service: this.constructor.name });
    this.repository = options.repository;
    this.scheduler = options.scheduler;
  }

  /**
   * Abstract method to be implemented by concrete subclasses.
   * This method is responsible for fetching the Tech Radar entries
   * from the specific data source (e.g., a file, an API).
   *
   * @returns A promise that resolves to an array of TechRadarEntry objects.
   */
  abstract read(): Promise<TechRadarEntry[]>;

  scheduleUpdateTask(): void {
    this.logger.info(
      `Scheduling Tech Radar update task '${this.taskId}'}`,
    );

    this.scheduler.scheduleTask({
      id: this.taskId,
      frequency: this.taskFrequency,
      timeout: { minutes: 10 },
      fn: async () => {
        this.logger.info(`Running scheduled Tech Radar update (task: ${this.taskId})...`);
        try {
          const entries = await this.read();
          this.logger.info(`Read ${entries.length} entries from the source.`);

          await this.repository.updateAll(entries);
          this.logger.info(
            `Successfully updated ${entries.length} entries in the Tech Radar database.`,
          );
        } catch (error: any) {
          this.logger.error(
            `Tech Radar update task '${this.taskId}' failed: ${error.message}`,
            { error },
          );
        }
      },
    });
  }

  async triggerRefresh(): Promise<void> {
    this.logger.info('Manually triggering Tech Radar data refresh...');
    try {
      const entries = await this.read();
      this.logger.info(`Read ${entries.length} entries from the source.`);
      await this.repository.updateAll(entries);
      this.logger.info(
        `Successfully updated ${entries.length} entries in the Tech Radar database via manual trigger.`,
      );
    } catch (error: any) {
      this.logger.error(
        `Manual Tech Radar data refresh failed: ${error.message}`,
        { error },
      );
      throw new Error(`Manual refresh failed: ${error.message}`);
    }
  }
}
