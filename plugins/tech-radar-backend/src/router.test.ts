
// <ai_context>
// This file contains unit tests for the tech radar backend router.
// It uses supertest to make HTTP requests to the router instance and mocks
// the TechRadarFactory dependency to isolate the router logic.
// Tests cover the '/health' and '/data' endpoints, including success and error cases,
// ensuring the responses match the expected format based on the common model.
// </ai_context>
import { mockServices, mockErrorHandler } from '@backstage/backend-test-utils';
import express from 'express';
import request from 'supertest';
import { createRouter } from './router';
import { TechRadarFactory } from './factories/TechRadarFactory';
import { TechRadarLoaderResponse, MovedState } from '@backstage-community/plugin-tech-radar-common';

describe('createRouter', () => {
  let app: express.Express;
  let factory: jest.Mocked<TechRadarFactory>;

  // Define mock response adhering strictly to TechRadarLoaderResponse
  const mockRadarResponse: TechRadarLoaderResponse = {
    quadrants: [{ id: 'solutions', name: 'Solutions' }],
    rings: [
        { id: 'approved', name: 'Approved', color: '#00ff00' },
        { id: 'emerging', name: 'Emerging', color: '#ffff00' }
    ],
    entries: [
      {
        key: 'test-entry',
        id: 'test-entry-id',
        title: 'Test Entry',
        quadrant: 'solutions', // String ID
        timeline: [
          {
             date: new Date('2024-01-15T12:00:00.000Z'), // Date object
             ringId: 'approved', // String ID
             moved: MovedState.NoChange, // Use enum value
             description: 'latest status'
          },
           {
             date: new Date('2023-10-01T00:00:00.000Z'), // Date object
             ringId: 'emerging',
             moved: MovedState.MovedIn, // Use enum value
             description: 'previous status'
           }
        ],
        description: 'Full description here',
        links: [ { url: 'http://example.com', title: 'Example Link' } ]
      },
    ],
  };

  beforeAll(async () => {
    // Mock only the factory's public method needed by the router
    factory = {
      buildRadarResponse: jest.fn(),
    } as unknown as jest.Mocked<TechRadarFactory>;


    const router = await createRouter({
      logger: mockServices.logger.mock(),
      factory: factory,
    });
    app = express();
    // Add router and error handler
    app.use('/api/my-tech-radar', router); // Mount router with expected base path
    app.use(mockErrorHandler()); // Add mockErrorHandler AFTER your router
  });

  beforeEach(() => {
    jest.resetAllMocks();
  });

  describe('GET /health', () => {
    it('returns ok', async () => {
      const response = await request(app).get('/api/my-tech-radar/health');

      expect(response.status).toEqual(200);
      expect(response.body).toEqual({ status: 'ok' });
    });
  });

  describe('GET /data', () => {
    it('returns data from the factory, serializing dates correctly', async () => {
      // Arrange: Mock the factory response
      factory.buildRadarResponse.mockResolvedValue(mockRadarResponse);

      // Act: Make the request
      const response = await request(app).get('/api/my-tech-radar/data');

      // Assert: Check status and overall structure
      expect(response.status).toEqual(200);
      expect(response.body.quadrants).toEqual(mockRadarResponse.quadrants);
      expect(response.body.rings).toEqual(mockRadarResponse.rings);
      expect(response.body.entries).toHaveLength(1);

      // Assert: Check entry details, especially serialized dates
      const expectedEntry = {
          ...mockRadarResponse.entries[0],
          // Timeline dates should be ISO strings in the JSON response
          timeline: mockRadarResponse.entries[0].timeline.map(t => ({
              ...t,
              date: t.date.toISOString(), // Expect ISO string format
          })),
      };
      expect(response.body.entries[0]).toEqual(expectedEntry);

      // Assert: Check mock interaction
      expect(factory.buildRadarResponse).toHaveBeenCalledTimes(1);
    });

     it('returns 500 if factory throws an error', async () => {
       // Arrange: Mock the factory to throw an error
       const error = new Error('Factory failed spectacularly');
       factory.buildRadarResponse.mockRejectedValue(error);

       // Act: Make the request
       const response = await request(app).get('/api/my-tech-radar/data');

       // Assert: Check error status and response body from mockErrorHandler
       expect(response.status).toEqual(500);
       expect(response.body).toHaveProperty('error');
       expect(response.body.error.name).toEqual('Error');
       expect(response.body.error.message).toEqual(error.message);
       expect(response.body.response?.statusCode).toEqual(500);

       // Assert: Check mock interaction
       expect(factory.buildRadarResponse).toHaveBeenCalledTimes(1);
     });
  });
});
      