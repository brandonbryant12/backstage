import { MovedState } from '@backstage-community/plugin-tech-radar-common';
import { EntriesRepository, TechRadarEntry } from '../repository/entriesRepository';
import { TechRadarService } from './TechRadarService';
import { LoggerService } from '@backstage/backend-plugin-api';

const mockEntriesRepository: jest.Mocked<EntriesRepository> = {
  getAllEntries: jest.fn(),
} as any;

describe('TechRadarService', () => {
  let service: TechRadarService;
  let mockLogger: jest.Mocked<LoggerService>;
  let infoMock: jest.Mock;
  let errorMock: jest.Mock;

  beforeEach(() => {
    jest.resetAllMocks();

    infoMock = jest.fn();
    errorMock = jest.fn();

    mockLogger = {
      info: infoMock,
      error: errorMock,
      warn: jest.fn(),
      debug: jest.fn(),
      child: jest.fn().mockImplementation(() => ({
        info: infoMock, 
        error: errorMock,
        warn: jest.fn(),
        debug: jest.fn(),
      })),
    } as any; 
    
    service = new TechRadarService({
      logger: mockLogger,
      repository: mockEntriesRepository,
    });
  });

  it('should initialize correctly', () => {
    expect(service).toBeDefined();
    expect(mockLogger.child).toHaveBeenCalledWith({ service: 'TechRadarService' });
  });

  describe('getData', () => {
    const mockRepoEntries: TechRadarEntry[] = [
      {
        entry_id: 'id1',
        title: 'Entry 1',
        quadrant_name: 'Solutions',
        disposition_name: 'approved',
        description: 'Desc 1',
        date: new Date('2023-01-01T00:00:00.000Z'),
        url: 'http://example.com/1',
      },
      {
        entry_id: 'id2',
        title: 'Entry 2',
        quadrant_name: 'guidelines',
        disposition_name: 'EMERGING',
      },
      {
        entry_id: 'id3',
        title: 'Entry 3',
        quadrant_name: 'Patterns',
        disposition_name: 'Restricted',
        date: new Date('2023-03-03T00:00:00.000Z'),
      },
      {
        entry_id: 'id4',
        title: 'Entry 4',
        quadrant_name: 'Standards',
        disposition_name: 'SomethingElse',
      },
      {
        entry_id: 'id5',
        title: 'Entry 5',
        quadrant_name: 'UnknownQuadrant',
        disposition_name: 'approved',
      },
    ];

    it('should fetch entries, map them correctly, and return expected structure', async () => {
      mockEntriesRepository.getAllEntries.mockResolvedValue(mockRepoEntries);

      const result = await service.getData();

      expect(mockEntriesRepository.getAllEntries).toHaveBeenCalledTimes(1);
      expect(infoMock).toHaveBeenCalledWith('Fetching and processing Tech Radar entries');

      expect(result).toHaveProperty('quadrants');
      expect(result).toHaveProperty('rings');
      expect(result).toHaveProperty('entries');

      expect(result.quadrants).toHaveLength(4);
      expect(result.quadrants.map(q => q.id)).toEqual(['solutions', 'guidelines', 'patterns', 'standards']);
      expect(result.rings).toHaveLength(4);
      expect(result.rings.map(r => r.id)).toEqual(['submitted', 'emerging', 'approved', 'restricted']);

      expect(result.entries).toHaveLength(4);

      const entry1 = result.entries.find(e => e.key === 'id1');
      expect(entry1).toBeDefined();
      expect(entry1).toMatchObject({
        id: 'id1',
        key: 'id1', 
        title: 'Entry 1',
        quadrant: 'solutions',
        description: 'Desc 1',
        links: [{ url: 'http://example.com/1', title: 'Learn More' }],
        url: 'http://example.com/1',
        timeline: [
          {
            ringId: 'approved',
            moved: MovedState.NoChange,
          }
        ]
      });
      expect(entry1?.timeline[0].date.toISOString()).toBe('2023-01-01T00:00:00.000Z');

      const entry2 = result.entries.find(e => e.key === 'id2');
      expect(entry2).toBeDefined();
      expect(entry2).toMatchObject({
        id: 'id2',
        key: 'id2',
        title: 'Entry 2',
        quadrant: 'guidelines',
        description: undefined,
        url: undefined,
        timeline: [
          {
            ringId: 'emerging',
            moved: MovedState.NoChange,
          }
        ]
      });
      expect(entry2?.timeline[0].date).toBeInstanceOf(Date);
      expect(isNaN(entry2!.timeline[0].date.getTime())).toBe(false);

      const entry4 = result.entries.find(e => e.key === 'id4');
      expect(entry4).toBeDefined();
      expect(entry4?.timeline[0]).toMatchObject({
          ringId: 'submitted',
          moved: MovedState.NoChange,
      });
      expect(entry4?.timeline[0].date).toBeInstanceOf(Date);
      expect(isNaN(entry4!.timeline[0].date.getTime())).toBe(false);
    });

    it('should return empty entries array when repository is empty', async () => {
      mockEntriesRepository.getAllEntries.mockResolvedValue([]);

      const result = await service.getData();

      expect(result.entries).toEqual([]);
      expect(result.quadrants).toHaveLength(4);
      expect(result.rings).toHaveLength(4);
    });

    it('should filter out entries with unmapped quadrant names', async () => {
       const entriesWithUnknown = [
        {
          entry_id: 'id1',
          title: 'Entry 1',
          quadrant_name: 'Solutions',
          disposition_name: 'approved',
        },
        {
          entry_id: 'id5',
          title: 'Entry 5',
          quadrant_name: 'BadQuadrant',
          disposition_name: 'approved',
        },
      ];
      mockEntriesRepository.getAllEntries.mockResolvedValue(entriesWithUnknown);

      const result = await service.getData();

      expect(result.entries).toHaveLength(1);
      expect(result.entries.find(e => e.key === 'id5')).toBeUndefined();
      expect(result.entries[0].key).toBe('id1');
    });
  });
}); 