
// <ai_context>
// This file contains unit tests for the TechRadarDataEntryRepository class.
// It utilizes Jest mocks for the Knex instance and LoggerService to isolate
// the repository logic during testing. Tests cover scenarios like inserting valid data,
// handling invalid or incomplete source entries, processing empty inputs, and fetching data.
// </ai_context>
import { Knex } from 'knex';
import { getVoidLogger } from '@backstage/backend-common';
import { TechRadarDataEntryRepository, SourceEntry, RawDbEntry } from './TechRadarDataEntryRepository';
import { MovedState } from '@backstage-community/plugin-tech-radar-common';

// Mock Knex instance and its methods
const mockKnex = {
  transaction: jest.fn(),
  batchInsert: jest.fn(),
  select: jest.fn(),
  del: jest.fn(),
  // Mock query builder methods used within transaction
  where: jest.fn().mockReturnThis(), // Chainable
} as unknown as Knex;

// Mock transaction callback execution
(mockKnex.transaction as jest.Mock).mockImplementation(async (callback) => {
  // Provide a mock transaction object (trx) to the callback
  const mockTrx = {
    batchInsert: jest.fn().mockResolvedValue(undefined),
    del: jest.fn().mockResolvedValue(undefined),
    // Mock the table call returning the trx object itself for chaining like trx('table').del()
    table: jest.fn().mockReturnThis(),
    select: jest.fn(), // Add select mock if needed within transaction
  };
  // Mimic calling trx('my_tech_radar_entries') within the transaction
  (mockTrx.table as jest.Mock).mockImplementation((tableName: string) => {
      if (tableName === 'my_tech_radar_entries') {
          return mockTrx; // Return the mock trx for chaining .del() or .batchInsert()
      }
      return mockTrx; // Default fallback
  });
  return callback(mockTrx); // Execute the callback with the mock transaction
});

const logger = getVoidLogger(); // Use a void logger to suppress output during tests

describe('TechRadarDataEntryRepository', () => {
  let repository: TechRadarDataEntryRepository;
  let mockTrx: Knex.Transaction; // To access the transaction mock inside tests

  beforeEach(() => {
    jest.clearAllMocks();
    repository = new TechRadarDataEntryRepository(mockKnex, logger);

    // Reset the transaction mock implementation to capture the trx object
     (mockKnex.transaction as jest.Mock).mockImplementation(async (callback) => {
        mockTrx = {
            batchInsert: jest.fn().mockResolvedValue(undefined),
            del: jest.fn().mockResolvedValue(undefined),
            table: jest.fn().mockReturnThis(),
            select: jest.fn(),
            commit: jest.fn(), // Mock commit/rollback if necessary
            rollback: jest.fn(),
        } as unknown as Knex.Transaction;
        (mockTrx.table as jest.Mock).mockImplementation(() => mockTrx); // Chain table() call
        return callback(mockTrx);
     });
  });

  describe('replaceAllEntries', () => {
    const validSourceEntry1: SourceEntry = {
      key: 'entry1',
      id: 'id1',
      title: 'Entry 1',
      quadrant: 'solutions',
      description: 'Desc 1',
      timeline: [{ date: new Date('2024-01-01T00:00:00.000Z'), ringId: 'approved', moved: MovedState.NoChange, description: 'Approved' }],
      links: [{ title: 'Link 1', url: 'http://example.com/1' }],
    };
    const validSourceEntry2: SourceEntry = {
      key: 'entry2',
      title: 'Entry 2', // ID will default to key
      quadrant: { id: 'patterns' }, // Quadrant as object
      timeline: [
        { date: new Date('2024-02-15T10:00:00.000Z'), ringId: 'emerging', moved: MovedState.MovedIn },
        { date: new Date('2023-11-01T00:00:00.000Z'), ringId: 'submitted', moved: MovedState.NoChange, description: 'Initial submission' },
      ],
    };

    it('should delete existing entries and insert new valid entries', async () => {
      await repository.replaceAllEntries([validSourceEntry1, validSourceEntry2]);

      expect(mockKnex.transaction).toHaveBeenCalledTimes(1);
      expect(mockTrx.table).toHaveBeenCalledWith('my_tech_radar_entries');
      expect(mockTrx.del).toHaveBeenCalledTimes(1);

      expect(mockTrx.batchInsert).toHaveBeenCalledTimes(1);
      expect(mockTrx.batchInsert).toHaveBeenCalledWith(
        'my_tech_radar_entries',
        [
          // Expected DbRow format after transformation
          {
            key: 'entry1',
            id: 'id1',
            title: 'Entry 1',
            quadrant_id: 'solutions',
            ring_id: 'approved', // From latest timeline
            description: 'Desc 1',
            timeline: JSON.stringify([{ date: '2024-01-01T00:00:00.000Z', ringId: 'approved', moved: MovedState.NoChange, description: 'Approved' }]),
            links: JSON.stringify([{ title: 'Link 1', url: 'http://example.com/1' }]),
          },
          {
            key: 'entry2',
            id: 'entry2', // Defaulted to key
            title: 'Entry 2',
            quadrant_id: 'patterns',
            ring_id: 'emerging', // From latest timeline
            description: undefined,
            timeline: JSON.stringify([
              { date: '2024-02-15T10:00:00.000Z', ringId: 'emerging', moved: MovedState.MovedIn, description: undefined },
              { date: '2023-11-01T00:00:00.000Z', ringId: 'submitted', moved: MovedState.NoChange, description: 'Initial submission' },
            ]),
            links: null, // No links provided
          },
        ],
        50, // Default chunk size
      );
    });

    it('should handle empty input array correctly', async () => {
      await repository.replaceAllEntries([]);

      expect(mockKnex.transaction).toHaveBeenCalledTimes(1);
       expect(mockTrx.table).toHaveBeenCalledWith('my_tech_radar_entries');
      expect(mockTrx.del).toHaveBeenCalledTimes(1);
      expect(mockTrx.batchInsert).not.toHaveBeenCalled(); // No inserts
    });

     it('should handle null input correctly', async () => {
       await repository.replaceAllEntries(null as any); // Test null case

       expect(mockKnex.transaction).toHaveBeenCalledTimes(1);
       expect(mockTrx.table).toHaveBeenCalledWith('my_tech_radar_entries');
       expect(mockTrx.del).toHaveBeenCalledTimes(1);
       expect(mockTrx.batchInsert).not.toHaveBeenCalled();
     });

     it('should handle undefined input correctly', async () => {
       await repository.replaceAllEntries(undefined as any); // Test undefined case

       expect(mockKnex.transaction).toHaveBeenCalledTimes(1);
       expect(mockTrx.table).toHaveBeenCalledWith('my_tech_radar_entries');
       expect(mockTrx.del).toHaveBeenCalledTimes(1);
       expect(mockTrx.batchInsert).not.toHaveBeenCalled();
     });


    it('should skip entries with missing required fields', async () => {
      const invalidEntry: SourceEntry = { key: 'invalid', title: 'Invalid' }; // Missing quadrant, timeline
      await repository.replaceAllEntries([validSourceEntry1, invalidEntry]);

      expect(mockTrx.del).toHaveBeenCalledTimes(1);
      expect(mockTrx.batchInsert).toHaveBeenCalledTimes(1);
      // Only the valid entry should be inserted
      expect(mockTrx.batchInsert).toHaveBeenCalledWith(
        'my_tech_radar_entries',
        [ expect.objectContaining({ key: 'entry1' }) ], // Only valid entry1
        50,
      );
      // Optionally check logger warning if logger mock allows
    });

    it('should skip entries with invalid timeline (e.g., no valid date or ringId in latest)', async () => {
      const invalidTimelineEntry: SourceEntry = {
        key: 'invalid-timeline',
        title: 'Invalid Timeline',
        quadrant: 'guidelines',
        timeline: [{ date: new Date('invalid date'), ringId: 'approved' }], // Invalid date
      };
      const missingRingIdEntry: SourceEntry = {
         key: 'missing-ringid',
         title: 'Missing RingID',
         quadrant: 'standards',
         timeline: [{ date: new Date(), ringId: undefined as any }], // Missing ringId
      };
      await repository.replaceAllEntries([validSourceEntry1, invalidTimelineEntry, missingRingIdEntry]);

      expect(mockTrx.del).toHaveBeenCalledTimes(1);
      expect(mockTrx.batchInsert).toHaveBeenCalledTimes(1);
       // Only the valid entry should be inserted
      expect(mockTrx.batchInsert).toHaveBeenCalledWith(
         'my_tech_radar_entries',
         [ expect.objectContaining({ key: 'entry1' }) ],
         50,
       );
    });

     it('should skip entries where all timeline events are invalid', async () => {
       const allInvalidTimelineEntry: SourceEntry = {
         key: 'all-invalid',
         title: 'All Invalid',
         quadrant: 'solutions',
         timeline: [
             { date: new Date('invalid date'), ringId: 'approved'},
             { date: null as any, ringId: 'emerging'}
         ],
       };
       await repository.replaceAllEntries([allInvalidTimelineEntry]);

       expect(mockTrx.del).toHaveBeenCalledTimes(1);
       expect(mockTrx.batchInsert).not.toHaveBeenCalled();
     });

    it('should default moved state to NoChange if invalid or missing', async () => {
        const invalidMovedEntry: SourceEntry = {
          key: 'invalid-moved',
          title: 'Invalid Moved',
          quadrant: 'patterns',
          timeline: [{ date: new Date(), ringId: 'emerging', moved: 5 as any }], // Invalid moved value
        };
        const missingMovedEntry: SourceEntry = {
           key: 'missing-moved',
           title: 'Missing Moved',
           quadrant: 'patterns',
           timeline: [{ date: new Date(), ringId: 'submitted' }], // Missing moved
        };

        await repository.replaceAllEntries([invalidMovedEntry, missingMovedEntry]);

        expect(mockTrx.batchInsert).toHaveBeenCalledTimes(1);
        const insertedRows = (mockTrx.batchInsert as jest.Mock).mock.calls[0][1];
        const insertedTimelineInvalid = JSON.parse(insertedRows[0].timeline);
        const insertedTimelineMissing = JSON.parse(insertedRows[1].timeline);

        expect(insertedTimelineInvalid[0].moved).toBe(MovedState.NoChange);
        expect(insertedTimelineMissing[0].moved).toBe(MovedState.NoChange);
    });

     it('should handle entries with no links', async () => {
        await repository.replaceAllEntries([validSourceEntry2]); // Entry 2 has no links

        expect(mockTrx.batchInsert).toHaveBeenCalledTimes(1);
        const insertedRows = (mockTrx.batchInsert as jest.Mock).mock.calls[0][1];
        expect(insertedRows[0].links).toBeNull();
     });
  });

  describe('findAllEntries', () => {
    it('should fetch and return all entries from the database', async () => {
      const mockRawEntries: RawDbEntry[] = [
        { key: 'e1', id: 'id1', title: 'Entry 1', quadrant_id: 'q1', ring_id: 'r1', timeline: '[]', links: '[]' },
        { key: 'e2', id: 'id2', title: 'Entry 2', quadrant_id: 'q2', ring_id: 'r2', timeline: '[]' },
      ];
      // Mock the select method on the Knex instance directly
      (mockKnex.select as jest.Mock).mockImplementation(() => {
         // Mock the behavior of db('tableName').select(...)
         return {
             from: jest.fn().mockResolvedValue(mockRawEntries) // Mock the final resolution
         };
      });
       // Mock the table call returning the mockKnex object itself for chaining like db('table').select()
      (mockKnex as any).table = jest.fn().mockReturnThis();


      const result = await repository.findAllEntries();

      expect(mockKnex.table).toHaveBeenCalledWith('my_tech_radar_entries');
      expect(mockKnex.select).toHaveBeenCalledWith(
          'key', 'id', 'title', 'quadrant_id', 'ring_id', 'description', 'timeline', 'links'
      );
      expect(result).toEqual(mockRawEntries);
    });

     it('should return an empty array if no entries exist', async () => {
       (mockKnex.select as jest.Mock).mockImplementation(() => ({
          from: jest.fn().mockResolvedValue([])
       }));
       (mockKnex as any).table = jest.fn().mockReturnThis();


       const result = await repository.findAllEntries();

       expect(mockKnex.table).toHaveBeenCalledWith('my_tech_radar_entries');
       expect(mockKnex.select).toHaveBeenCalled();
       expect(result).toEqual([]);
     });
  });
});
      