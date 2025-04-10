import {
  mockErrorHandler,
  mockServices,
} from '@backstage/backend-test-utils';
import express from 'express';
import request from 'supertest';

import { createRouter } from './router';
import { EntriesRepository, TechRadarEntry } from './repository/entriesRepository';
import { TechRadarLoaderResponse, MovedState } from '@backstage-community/plugin-tech-radar-common';

const mockRepoEntries: TechRadarEntry[] = [
  {
    entry_id: 'entry1',
    title: 'Entry One',
    quadrant_name: 'Solutions',
    disposition_name: 'Approved',
    description: 'Description for entry 1',
    date: new Date('2024-01-15T00:00:00.000Z'),
    url: 'http://example.com/entry1',
  },
  {
    entry_id: 'entry2',
    title: 'Entry Two',
    quadrant_name: 'Patterns',
    disposition_name: 'Emerging',
    date: new Date('2024-02-20T00:00:00.000Z'),
  },
  {
    entry_id: 'entry3',
    title: 'Entry Three',
    quadrant_name: 'Bad Quadrant',
    disposition_name: 'Submitted',
    date: new Date('2024-03-10T00:00:00.000Z'),
  },
];

const expectedRadarResponse: TechRadarLoaderResponse = {
  quadrants: [
    { id: 'solutions', name: 'Solutions' },
    { id: 'guidelines', name: 'Guidelines' },
    { id: 'patterns', name: 'Patterns' },
    { id: 'standards', name: 'Standards' },
  ],
  rings: [
    { id: 'submitted', name: 'Submitted', color: '#9e9e9e' },
    { id: 'emerging', name: 'Emerging', color: '#8bc34a' },
    { id: 'approved', name: 'Approved', color: '#4caf50' },
    { id: 'restricted', name: 'Restricted', color: '#ff9800' },
  ],
  entries: [
    {
      key: 'entry1',
      id: 'entry1',
      quadrant: 'solutions',
      title: 'Entry One',
      description: 'Description for entry 1',
      timeline: [
        {
          date: new Date('2024-01-15T00:00:00.000Z'),
          ringId: 'approved',
          moved: 0 as MovedState,
        },
      ],
      links: [{ url: 'http://example.com/entry1', title: 'Learn More' }],
      url: 'http://example.com/entry1',
    },
    {
      key: 'entry2',
      id: 'entry2',
      quadrant: 'patterns',
      title: 'Entry Two',
      timeline: [
        {
          date: new Date('2024-02-20T00:00:00.000Z'),
          ringId: 'emerging',
          moved: 0 as MovedState,
        },
      ],
    },
  ],
};

describe('createRouter', () => {
  let app: express.Express;
  let entriesRepository: jest.Mocked<EntriesRepository>;

  beforeEach(async () => {
    entriesRepository = {
      getAllEntries: jest.fn(),
    } as any; 
    const mockLogger = mockServices.logger.mock();

    const router = await createRouter({
      logger: mockLogger,
      httpAuth: mockServices.httpAuth(),

      entriesRepository: entriesRepository, 
    });
    app = express();
    app.use(router);
    app.use(mockErrorHandler());
  });

  describe('GET /data', () => {
    it('should return Tech Radar data processed by the service', async () => {
      entriesRepository.getAllEntries.mockResolvedValue(mockRepoEntries);

      const response = await request(app).get('/data');
      expect(response.status).toBe(200);
      expect(response.body).toEqual(JSON.parse(JSON.stringify(expectedRadarResponse)));
      expect(entriesRepository.getAllEntries).toHaveBeenCalledTimes(1);
    });

    it('should handle errors from the repository', async () => {
      const errorMessage = 'Failed to fetch data';
      entriesRepository.getAllEntries.mockRejectedValue(
        new Error(errorMessage),
      );

      const response = await request(app).get('/data');

      expect(response.status).toBe(500);
      expect(entriesRepository.getAllEntries).toHaveBeenCalledTimes(1);
    });
  });

  describe('GET /health', () => {
     it('returns ok', async () => {
       const response = await request(app).get('/health');

       expect(response.status).toEqual(200);
       expect(response.body).toEqual({ status: 'ok' });
     });
   });
});
      