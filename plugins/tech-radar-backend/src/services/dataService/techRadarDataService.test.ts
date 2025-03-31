import { LoggerService, SchedulerService } from '@backstage/backend-plugin-api';
import { EntriesRepository } from '../../repository/entriesRepository';
import { TechRadarDataService } from './techRadarDataService';
import sampleData from './sample-data.json';

const mockRepository = {
  getAllEntries: jest.fn(),
  updateAll: jest.fn(),
} as any as jest.Mocked<EntriesRepository>;


const mockScheduler: jest.Mocked<SchedulerService> = {
  scheduleTask: jest.fn(),
  createScheduledTaskRunner: jest.fn(),
  triggerTask: jest.fn(),
  getScheduledTasks: jest.fn(),
};

describe('TechRadarDataService', () => {
  let service: TechRadarDataService;
  let mockLogger: jest.Mocked<LoggerService>;
  
  beforeEach(() => {
    jest.resetAllMocks();
    const infoMock = jest.fn();
    const errorMock = jest.fn();
    mockLogger = {
      info: infoMock,
      error: errorMock,
      child: jest.fn().mockReturnValue({
        info: infoMock,
        error: errorMock,
      }),
      debug: jest.fn(),
      warn: jest.fn(),
    } as any as jest.Mocked<LoggerService>;

    service = new TechRadarDataService({
      repository: mockRepository,
      logger: mockLogger,
      scheduler: mockScheduler
    });
  });

  it('should construct and initialize logger', () => {
    expect(mockLogger.child).toHaveBeenCalledWith({ service: 'TechRadarDataService' });
  });

  describe('read', () => {
    it('should read and parse sample data', async () => {
      const result = await service.read();

      expect(mockLogger.info).toHaveBeenCalledWith('Reading sample Tech Radar data...');
      expect(result).toHaveLength(sampleData.length);
      expect(result[0].entry_id).toBe(sampleData[0].entry_id);
      expect(result[0].date).toBeInstanceOf(Date);
      expect(result[3].url).toBeUndefined();
      expect(result[3].date).toBeInstanceOf(Date);
      expect(result[3].date?.toISOString()).toBe(sampleData[3].date);

    });
  });

  describe('scheduleUpdateTask', () => {
    it('should schedule the task with correct parameters', () => {
      service.scheduleUpdateTask();
      expect(mockScheduler.scheduleTask).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'tech-radar-data-refresh',
          frequency: { days: 1 },
          timeout: { minutes: 10 },
        }),
      );
      expect(mockLogger.info).toHaveBeenCalledWith(
        expect.stringContaining('Scheduling Tech Radar update task'),
      );
    });

    it('should run the scheduled task successfully', async () => {
      const mockEntries = [{ entry_id: 'test' }] as any[];
      const readSpy = jest.spyOn(service, 'read').mockResolvedValueOnce(mockEntries);
      mockRepository.updateAll.mockResolvedValueOnce(undefined);

      service.scheduleUpdateTask();

      const taskFn = (mockScheduler.scheduleTask as jest.Mock).mock.calls[0][0].fn;
      expect(taskFn).toBeInstanceOf(Function); // Ensure we got the function

      await taskFn();

      expect(readSpy).toHaveBeenCalledTimes(1);
      expect(mockRepository.updateAll).toHaveBeenCalledWith(mockEntries);
      expect(mockLogger.info).toHaveBeenCalledWith(
        expect.stringContaining('Running scheduled Tech Radar update'),
      );
      expect(mockLogger.info).toHaveBeenCalledWith(
        `Read ${mockEntries.length} entries from the source.`,
      );
      expect(mockLogger.info).toHaveBeenCalledWith(
        expect.stringContaining('Successfully updated'),
      );
      expect(mockLogger.error).not.toHaveBeenCalled();
    });

    it('should handle errors during the scheduled task', async () => {
      const error = new Error('Failed to read');
      const readSpy = jest.spyOn(service, 'read').mockRejectedValueOnce(error);

      service.scheduleUpdateTask();

      const taskFn = (mockScheduler.scheduleTask as jest.Mock).mock.calls[0][0].fn;
      expect(taskFn).toBeInstanceOf(Function);

      await taskFn();

      expect(readSpy).toHaveBeenCalledTimes(1);
      expect(mockRepository.updateAll).not.toHaveBeenCalled();
      expect(mockLogger.error).toHaveBeenCalledWith(
        expect.stringContaining('failed: Failed to read'),
        { error },
      );
    });
  });

  describe('triggerRefresh', () => {
    it('should manually trigger refresh successfully', async () => {
      const mockEntries = [{ entry_id: 'test-refresh' }] as any[];
      const readSpy = jest.spyOn(service, 'read').mockResolvedValueOnce(mockEntries);
      mockRepository.updateAll.mockResolvedValueOnce(undefined);

      await service.triggerRefresh();

      expect(readSpy).toHaveBeenCalledTimes(1);
      expect(mockRepository.updateAll).toHaveBeenCalledWith(mockEntries);
      expect(mockLogger.info).toHaveBeenCalledWith(
        'Manually triggering Tech Radar data refresh...',
      );
      expect(mockLogger.info).toHaveBeenCalledWith(
        `Read ${mockEntries.length} entries from the source.`,
      );
      expect(mockLogger.info).toHaveBeenCalledWith(
        expect.stringContaining('Successfully updated'),
      );
      expect(mockLogger.error).not.toHaveBeenCalled();
    });

    it('should handle errors during manual trigger and throw', async () => {
      const error = new Error('Update failed');
      const readSpy = jest.spyOn(service, 'read').mockResolvedValueOnce([{ entry_id: 'test' }] as any);
      mockRepository.updateAll.mockRejectedValueOnce(error);

      await expect(service.triggerRefresh()).rejects.toThrow(
        'Manual refresh failed: Update failed',
      );

      expect(readSpy).toHaveBeenCalledTimes(1);
      expect(mockRepository.updateAll).toHaveBeenCalled();
      expect(mockLogger.error).toHaveBeenCalledWith(
        expect.stringContaining('Manual Tech Radar data refresh failed: Update failed'),
        { error },
      );
    });
  });
}); 