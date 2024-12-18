import request from 'supertest';
import express from 'express';
import { createRouter } from './router';
import { mockServices } from '@backstage/backend-test-utils';
import { ConfigReader } from '@backstage/config';
import { MockJiraService } from './service/MockJiraService';
import { jest } from '@jest/globals';

describe('Router()', () => {
  let app: express.Express;
  let mockJiraService: MockJiraService;

  beforeEach(async () => {
    jest.resetAllMocks();
    const logger = mockServices.logger.mock();
    const config = new ConfigReader({
      feedback: {
        jira: {
          clientId: 'test-client-id',
          clientSecret: 'test-client-secret',
        },
      },
    });

    mockJiraService = new MockJiraService(logger);

    const router = await createRouter({
      logger,
      jiraService: mockJiraService,
      config,
    });

    app = express().use(router);
  });

  describe('GET /health', () => {
    it('should respond with 200 and status ok', async () => {
      const res = await request(app).get('/health').send();
      expect(res.status).toBe(200);
      expect(res.body).toEqual({ status: 'ok' });
    });
  });

  describe('POST /tickets', () => {
    it('should return 400 for invalid input', async () => {
      const invalidPayload = {
        projectKey: 123,
        summary: '',
      };
      const res = await request(app)
        .post('/tickets')
        .send(invalidPayload);
      expect(res.status).toBe(400);
      expect(res.text).toContain('Invalid request body');
    });

    it('should return 201 for valid input and create a ticket', async () => {
      const validPayload = {
        projectKey: 'TEST',
        summary: 'Test summary',
        description: 'Test description',
        tag: 'test-tag',
        feedbackType: 'BUG',
        reporter: 'test-reporter',
      };
      const res = await request(app)
        .post('/tickets')
        .send(validPayload);
      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('id');
      expect(res.body).toHaveProperty('key');
    });
  });

  describe('GET /tickets/:ticketId', () => {
    it('should return 200 with ticket details for a known ticket', async () => {
      const ticket = await mockJiraService.createJiraTicket();
      const res = await request(app)
        .get(`/tickets/${ticket.key}`)
        .send();
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('status');
      expect(res.body).toHaveProperty('assignee');
      expect(res.body).toHaveProperty('avatarUrl');
    });
  });

  describe('POST /issues', () => {
    it('should return 200 for valid projectKey', async () => {
      const mockResponse = {
        projectUrl: 'http://example.com/browse/TEST',
        issues: [
          {
            name: 'Bug',
            iconUrl: 'https://example.com/bug-icon.jpg',
            total: 1,
            url: 'http://example.com/browse/TEST',
          },
        ],
      };

      jest.spyOn(mockJiraService, 'getIssues').mockResolvedValueOnce(mockResponse);

      const res = await request(app)
        .post('/issues')
        .send({ projectKey: 'TEST' });

      expect(res.status).toBe(200);
      expect(res.body).toEqual(mockResponse);
    });

    it('should return 400 if projectKey is missing', async () => {
      const res = await request(app)
        .post('/issues')
        .send({});
      expect(res.status).toBe(400);
      expect(res.text).toContain('Project key is required');
    });

    it('should support component, label, and statusesNames', async () => {
      const mockResponse = {
        projectUrl: 'http://example.com/browse/TEST',
        issues: [
          {
            name: 'Bug',
            iconUrl: 'https://example.com/bug-icon.jpg',
            total: 1,
            url: 'http://example.com/browse/TEST',
          },
          {
            name: 'Task',
            iconUrl: 'https://example.com/task-icon.jpg',
            total: 2,
            url: 'http://example.com/browse/TEST',
          },
        ],
      };

      jest.spyOn(mockJiraService, 'getIssues').mockResolvedValueOnce(mockResponse);

      const res = await request(app)
        .post('/issues')
        .send({
          projectKey: 'TEST',
          component: 'backend-component',
          label: 'my-label',
          statusesNames: ['In Progress', 'To Do']
        });

      expect(res.status).toBe(200);
      expect(res.body).toEqual(mockResponse);
      expect(mockJiraService.getIssues).toHaveBeenCalledWith(
        'TEST',
        'backend-component',
        'my-label',
        ['In Progress', 'To Do']
      );
    });
  });
});