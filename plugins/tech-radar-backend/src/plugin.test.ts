
// <ai_context>
// This file contains integration tests for the tech radar backend plugin.
// It uses @backstage/backend-test-utils to start a test backend with the plugin
// and its dependencies configured (using an in-memory SQLite database).
// It mocks the CsvTechRadarDataService and the TaskScheduler to avoid external calls
// and unpredictable task execution during tests.
// Tests verify the '/health' and '/data' API endpoints, checking against the expected
// data model structure after processing and factory mapping.
// </ai_context>
import { startTestBackend, TestDatabases, mockServices } from '@backstage/backend-test-utils';
import { techRadarPlugin } from './plugin';
import request from 'supertest';
import { Knex } from 'knex';
import { ConfigReader } from '@backstage/config';
import path from 'path';

// Define the migration path relative to the test file location
const MIGRATIONS_PATH = path.resolve(__dirname, 'migrations');


// Mock the data service to avoid external calls and scheduler issues in tests
jest.mock('./services/CsvTechRadarDataService', () => ({
  CsvTechRadarDataService: jest.fn().mockImplementation(() => ({
    read: jest.fn().mockResolvedValue([ // Provide mock source data matching SourceEntry structure
        { key: 'entry1', id: 'id1', title: 'Entry 1', quadrant: 'solutions', timeline: [{ date: new Date('2024-01-01T00:00:00.000Z'), ringId: 'approved', moved: 0, description: 'desc1' }] },
        { key: 'entry2', id: 'id2', title: 'Entry 2', quadrant: 'patterns', timeline: [{ date: new Date('2024-01-02T00:00:00.000Z'), ringId: 'emerging', moved: 1, description: 'desc2' }] },
    ]),
  })),
}));

// Mock the scheduler service used by the plugin
jest.mock('@backstage/backend-plugin-api', () => {
  const actual = jest.requireActual('@backstage/backend-plugin-api');
  return {
    ...actual,
    coreServices: {
      ...actual.coreServices,
      // Provide a mocked scheduler service implementation
      scheduler: mockServices.scheduler.mock(),
    },
  };
});
// Also mock the legacy tasks scheduler if it's still potentially imported
jest.mock('@backstage/backend-tasks', () => ({
    TaskScheduler: { // Legacy scheduler class if used directly
      fromConfig: jest.fn().mockReturnValue({
         createScheduledTaskRunner: jest.fn(),
      }),
    },
    // Legacy function if used directly
     createLegacyPluginTaskScheduler: jest.fn().mockReturnValue({
         scheduleTask: jest.fn(),
     }),
}));


describe('techRadarPlugin', () => {
  let db: Knex;
  let testBackend: Awaited<ReturnType<typeof startTestBackend>>;
  const databases = TestDatabases.create({
       connection: {
           client: 'better-sqlite3',
           connection: ':memory:',
       }
   });

  // Setup test database connection before all tests
  beforeAll(async () => {
     db = await databases.init('my-tech-radar'); // Use plugin ID for isolation

    // Define minimal config required by the plugin
    const config = new ConfigReader({
      myTechRadar: {
        source: { csv: { url: 'mock://url' } },
        // No specific DB config needed here, will use root backend.database
      },
      backend: { // Required by TestDatabases
        database: { client: 'better-sqlite3', connection: ':memory:' },
         // tasks config might not be strictly needed if using coreServices.scheduler mock
         tasks: { scheduler: { enabled: true } },
      },
    });

     // Start the test backend once for all tests in this suite
     testBackend = await startTestBackend({
       features: [techRadarPlugin],
       services: [
         // Provide DB service configured for the plugin
         [ 'database', databases.forPlugin('my-tech-radar') ],
         [ 'config', config ],
         // Core services (some are mocked above via jest.mock)
         ['logger', mockServices.logger.mock()],
         ['scheduler', mockServices.scheduler.mock()], // Ensure the explicit mock is used
         ['urlReader', mockServices.urlReader.mock()],
       ],
     });

     // Run migrations using the Knex instance connected to the test DB
     await db.migrate.latest({
         directory: MIGRATIONS_PATH // Use the correct path constant
     });
  });

   // Clean up database table after each test
   afterEach(async () => {
     await db('my_tech_radar_entries').del();
     jest.clearAllMocks();
   });

   // Close DB connection after all tests
   afterAll(async () => {
      await db.destroy();
      // Optionally stop the backend server if needed, though usually not required
      // await testBackend?.server.close();
   });

  it('should have a health endpoint', async () => {
    // Make request to the already running test backend server
    const response = await request(testBackend.server).get('/api/my-tech-radar/health');

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ status: 'ok' });
  });

  it('should serve data from the /data endpoint after manual data insertion', async () => {
     // Arrange: Manually insert data into the test DB
     const timeline1 = JSON.stringify([{ date: '2024-01-10T00:00:00.000Z', ringId: 'approved', moved: 0, description: 'DB Desc' }]);
     const links1 = JSON.stringify([{ url: 'http://a.com', title: 'Link A'}]);
     await db('my_tech_radar_entries').insert([
        { key: 'db-entry', id: 'db-id', title: 'DB Entry', quadrant_id: 'solutions', ring_id: 'approved', timeline: timeline1, links: links1, description: 'Main Desc' },
     ]);

     // Act: Make request to the data endpoint
    const response = await request(testBackend.server).get('/api/my-tech-radar/data'); // Use correct plugin ID path

    // Assert: Check response status and basic structure
    expect(response.status).toBe(200);
    expect(response.body).toEqual(expect.objectContaining({
        quadrants: expect.any(Array),
        rings: expect.any(Array),
        entries: expect.any(Array),
    }));

    // Assert: Check static data (quadrants/rings) - assuming defaults
    expect(response.body.quadrants).toHaveLength(4);
    expect(response.body.rings).toHaveLength(4);

    // Assert: Check dynamic data (entries)
    expect(response.body.entries).toHaveLength(1);
    const entry = response.body.entries[0];
    expect(entry).toEqual({
        key: 'db-entry',
        id: 'db-id',
        title: 'DB Entry',
        quadrant: 'solutions', // Mapped quadrant ID (string)
        description: 'Main Desc',
        timeline: [ // Timeline array with date as ISO string
            { date: '2024-01-10T00:00:00.000Z', ringId: 'approved', moved: 0, description: 'DB Desc' }
        ],
        links: [ // Links array
            { url: 'http://a.com', title: 'Link A'}
        ]
    });
  });

    it('should return empty entries if database is empty', async () => {
        // Arrange: Ensure table is empty (done by afterEach)

        // Act: Make request to the data endpoint
        const response = await request(testBackend.server).get('/api/my-tech-radar/data');

        // Assert: Check response for empty entries
        expect(response.status).toBe(200);
        expect(response.body.entries).toHaveLength(0);
        expect(response.body.quadrants).toHaveLength(4); // Static data should still exist
        expect(response.body.rings).toHaveLength(4);
    });

   // Future tests:
   // - Test with multiple entries and multiple timeline events per entry
   // - Test with entries missing optional fields (description, links)
   // - Test error scenarios if the factory encounters invalid data (e.g., unknown quadrant/ring ID in DB)
});
      