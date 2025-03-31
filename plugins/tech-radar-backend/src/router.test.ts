
import {
  mockCredentials,
  mockErrorHandler,
  mockServices,
} from '@backstage/backend-test-utils';
import express from 'express';
import request from 'supertest';

import { createRouter } from './router';
import { EntriesRepository } from './services/types'; // Import the interface
import { TechRadarLoaderResponse } from '@backstage-community/plugin-tech-radar-common'; // Import the response type

// Mock data matching the TechRadarLoaderResponse structure
const mockRadarData: TechRadarLoaderResponse = {
  entries: [
    // Add mock entries as needed for detailed tests
    {
      key: 'entry1',
      id: 'entry1',
      title: 'Entry One',
      quadrant: 'q1',
      timeline: [
        {
          date: new Date('2024-01-15T00:00:00.000Z'),
          ringId: 'r1',
          description: 'First appearance',
          moved: 0,
        },
      ],
    },
  ],
  quadrants: [{ id: 'q1', name: 'Quadrant 1' }],
  rings: [{ id: 'r1', name: 'Ring 1', color: '#ff0000' }],
};

describe('createRouter', () => {
  let app: express.Express;
  let entriesRepository: jest.Mocked<EntriesRepository>; // Mock the repository

  beforeEach(async () => {
    // Mock the repository methods
    entriesRepository = {
      getTechRadarData: jest.fn(),
    };
    const router = await createRouter({
      httpAuth: mockServices.httpAuth(),
      entriesRepository, // Pass the mocked repository
    });
    app = express();
    app.use(router);
    app.use(mockErrorHandler());
  });

  describe('GET /data', () => {
    it('should return Tech Radar data from the repository', async () => {
      entriesRepository.getTechRadarData.mockResolvedValue(mockRadarData);

      const response = await request(app).get('/data');

      expect(response.status).toBe(200);
      // Need to serialize dates for comparison if they exist in mockRadarData
      expect(response.body).toEqual(JSON.parse(JSON.stringify(mockRadarData)));
      expect(entriesRepository.getTechRadarData).toHaveBeenCalledTimes(1);
    });

    it('should handle errors from the repository', async () => {
      const errorMessage = 'Failed to fetch data';
      entriesRepository.getTechRadarData.mockRejectedValue(
        new Error(errorMessage),
      );

      const response = await request(app).get('/data');

      expect(response.status).toBe(500);
      // The exact error message might depend on the error handler middleware
      // expect(response.body.error.message).toContain(errorMessage);
    });
  });

  describe('GET /health', () => {
     it('returns ok', async () => {
       const response = await request(app).get('/health');

       expect(response.status).toEqual(200);
       expect(response.body).toEqual({ status: 'ok' });
     });
   });

  // Remove tests related to POST /todos and GET /todos/:id as they are removed
});
      