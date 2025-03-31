import { TechRadarCSVDataService } from './techRadarCSVDataService';
import { LoggerService, SchedulerService } from '@backstage/backend-plugin-api';
import { EntriesRepository } from '../repository/entriesRepository';
import fs from 'fs';
import { parse } from 'csv-parse/sync';

jest.mock('fs');
jest.mock('csv-parse/sync');

const mockLogger: LoggerService = {
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  debug: jest.fn(),
  child: jest.fn().mockReturnThis(),
};

const mockScheduler: SchedulerService = {
  scheduleTask: jest.fn(),
  triggerTask: jest.fn(),
  createScheduledTaskRunner: jest.fn(),
  getScheduledTasks: jest.fn(),
};

const mockRepository = {
  updateAll: jest.fn().mockResolvedValue(undefined),
  getAllEntries: jest.fn(),
} as unknown as EntriesRepository;

const csvData = `entry_id,title,quadrant_name,disposition_name,description,date,url
1,Title 1,Quadrant 1,Disposition 1,Description 1,2023-01-01,http://example.com`;

(fs.readFileSync as jest.Mock).mockReturnValue(csvData);
(parse as jest.Mock).mockReturnValue([
  {
    entry_id: '1',
    title: 'Title 1',
    quadrant_name: 'Quadrant 1',
    disposition_name: 'Disposition 1',
    description: 'Description 1',
    date: '2023-01-01',
    url: 'http://example.com',
  },
]);

describe('TechRadarCSVDataService', () => {
  it('should read and parse CSV data correctly', async () => {
    const service = new TechRadarCSVDataService('/path/to/csv', {
      logger: mockLogger,
      repository: mockRepository,
      scheduler: mockScheduler,
    });

    const entries = await service.read();

    expect(entries).toEqual([
      {
        entry_id: '1',
        title: 'Title 1',
        quadrant_name: 'Quadrant 1',
        disposition_name: 'Disposition 1',
        description: 'Description 1',
        date: new Date('2023-01-01'),
        url: 'http://example.com',
      },
    ]);
  });
});
