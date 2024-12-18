import { ConfigReader } from '@backstage/config';
import { rest } from 'msw';
import { setupServer } from 'msw/node';
import { JiraService } from './JiraService';
import { mockServices } from '@backstage/backend-test-utils';

describe('JiraService', () => {
  const server = setupServer();
  
  const mockConfig = new ConfigReader({
    feedback: {
      jira: {
        clientId: 'test-client-id',
        clientSecret: 'test-client-secret',
        jiraServicePat: 'test-pat',
      },
    },
  });

  let jiraService: JiraService;
  let cacheMock: ReturnType<typeof mockServices.cache.mock>;

  beforeAll(() => {
    server.listen();
  });
  
  afterEach(() => {
    server.resetHandlers();
    jest.clearAllMocks();
  });
  
  afterAll(() => {
    server.close();
  });

  beforeEach(() => {
    process.env.BACKEND_BASEURL = 'http://localhost:7007';
    cacheMock = mockServices.cache.mock();
    jiraService = new JiraService(mockServices.logger.mock(), mockConfig, cacheMock);
  });

  describe('Token Caching', () => {
    beforeEach(() => {
      server.use(
        rest.post('http://localhost:7007/oauth', (_, res, ctx) => {
          return res(ctx.json({ token: 'mock-token', expires_in: 3600 }));
        }),
        rest.post('http://localhost:7007/api/2/issue', (_, res, ctx) => {
          return res(
            ctx.json({
              id: '12345',
              key: 'TEST-123',
              self: 'http://jira.example.com/rest/api/2/issue/12345',
            })
          );
        }),
        rest.get('http://localhost:7007/api/2/issue/TEST-123', (_, res, ctx) => {
          return res(
            ctx.json({
              fields: {
                status: { name: 'Open' },
                assignee: null,
              },
            })
          );
        })
      );
    });

    it('retrieves a token and caches it if not present in cache', async () => {
      cacheMock.get.mockResolvedValueOnce(undefined);

      await jiraService.createJiraTicket({
        projectKey: 'TEST',
        summary: 'Test Issue',
        description: 'Test Description',
        reporter: 'test-user',
        tag: 'test-tag',
        feedbackType: 'BUG',
      });

      expect(cacheMock.get).toHaveBeenCalledWith('jira-backend-auth-token');
      expect(cacheMock.set).toHaveBeenCalledWith(
        'jira-backend-auth-token',
        'mock-token',
        { ttl: 3540 }
      );
    });

    it('uses a cached token if available', async () => {
      cacheMock.get.mockResolvedValueOnce('cached-token');

      await jiraService.getTicketDetails('TEST-123');

      expect(cacheMock.get).toHaveBeenCalledWith('jira-backend-auth-token');
      expect(cacheMock.set).not.toHaveBeenCalled();
    });
  });

  describe('createJiraTicket', () => {
    beforeEach(() => {
      server.use(
        rest.post('http://localhost:7007/oauth', (_, res, ctx) => {
          return res(ctx.json({ token: 'mock-token', expires_in: 3600 }));
        })
      );
    });

    it('should create a ticket successfully', async () => {
      server.use(
        rest.post('http://localhost:7007/api/2/issue', (_, res, ctx) => {
          return res(
            ctx.json({
              id: '12345',
              key: 'TEST-123',
              self: 'http://jira.example.com/rest/api/2/issue/12345',
            })
          );
        })
      );

      const response = await jiraService.createJiraTicket({
        projectKey: 'TEST',
        summary: 'Test Issue',
        description: 'Test Description',
        reporter: 'test-user',
        tag: 'test-tag',
        feedbackType: 'BUG',
      });

      expect(response).toEqual({
        id: '12345',
        key: 'TEST-123',
        self: 'http://jira.example.com/rest/api/2/issue/12345',
      });
    });

    it('should handle API errors gracefully', async () => {
      server.use(
        rest.post('http://localhost:7007/api/2/issue', (_, res, ctx) => {
          return res(
            ctx.status(400),
            ctx.text('Invalid project key')
          );
        })
      );

      await expect(jiraService.createJiraTicket({
        projectKey: 'INVALID',
        summary: 'Test Issue',
        description: 'Test Description',
        reporter: 'test-user',
        tag: 'test-tag',
        feedbackType: 'BUG',
      })).rejects.toThrow('Request failed with status 400: Invalid project key');
    });
  });

  describe('getTicketDetails', () => {
    beforeEach(() => {
      server.use(
        rest.post('http://localhost:7007/oauth', (_, res, ctx) => {
          return res(ctx.json({ token: 'mock-token', expires_in: 3600 }));
        })
      );
    });

    it('should fetch ticket details successfully', async () => {
      server.use(
        rest.get('http://localhost:7007/api/2/issue/TEST-123', (_, res, ctx) => {
          return res(
            ctx.json({
              fields: {
                status: { name: 'In Progress' },
                assignee: {
                  displayName: 'John Doe',
                  avatarUrls: ['https://example.com/avatar.jpg'],
                },
              },
            })
          );
        })
      );

      const details = await jiraService.getTicketDetails('TEST-123');

      expect(details).toEqual({
        status: 'In Progress',
        assignee: 'John Doe',
        avatarUrl: 'https://example.com/avatar.jpg',
      });
    });

    it('should handle missing assignee', async () => {
      server.use(
        rest.get('http://localhost:7007/api/2/issue/TEST-123', (_, res, ctx) => {
          return res(
            ctx.json({
              fields: {
                status: { name: 'Open' },
                assignee: null,
              },
            })
          );
        })
      );

      const details = await jiraService.getTicketDetails('TEST-123');
      expect(details).toEqual({
        status: 'Open',
        assignee: null,
        avatarUrl: null,
      });
    });
  });

  describe('getAppUrl', () => {
    it('should return the correct app URL', () => {
      expect(jiraService.getAppUrl()).toBe('http://localhost:7007/app');
    });
  });

  describe('getIssues', () => {
    beforeEach(() => {
      server.use(
        rest.post('http://localhost:7007/oauth', (_, res, ctx) => {
          return res(ctx.json({ token: 'mock-token', expires_in: 3600 }));
        }),
        rest.get('http://localhost:7007/api/2/project/TEST', (_, res, ctx) => {
          return res(
            ctx.json({
              issueTypes: [
                {
                  self: 'http://example.com/issuetype/10001',
                  id: '10001',
                  description: 'Bug description',
                  iconUrl: 'https://example.com/bug-icon.jpg',
                  name: 'Bug',
                  subtask: false,
                },
                {
                  self: 'http://example.com/issuetype/10002',
                  id: '10002',
                  description: 'Task description',
                  iconUrl: 'https://example.com/task-icon.jpg',
                  name: 'Task',
                  subtask: false,
                },
              ],
            })
          );
        })
      );
    });

    it('should fetch issues successfully with default parameters', async () => {
      server.use(
        rest.post('http://localhost:7007/api/2/search', (req, res, ctx) => {
          const body = req.body as any;
          expect(body.jql).toContain('project = "TEST"');
          expect(body.jql).toContain('statuscategory not in ("Done")');
          expect(body.jql).not.toContain('component =');
          expect(body.jql).not.toContain('labels in');
          expect(body.jql).not.toContain('status in');
          return res(
            ctx.json({
              startAt: 0,
              maxResults: 50,
              total: 1,
              issues: [
                {
                  id: '1',
                  key: 'TEST-1',
                  fields: {
                    issuetype: {
                      id: '10001',
                      name: 'Bug',
                    },
                  },
                },
              ],
            })
          );
        })
      );

      const issues = await jiraService.getIssues('TEST');
      expect(issues).toEqual({
        projectUrl: 'http://localhost:7007/app/browse/TEST',
        issues: [
          {
            name: 'Bug',
            iconUrl: 'https://example.com/bug-icon.jpg',
            total: 1,
            url: 'http://localhost:7007/app/browse/TEST',
          },
        ],
      });
    });

    it('should support component, label, and statusesNames', async () => {
      server.use(
        rest.post('http://localhost:7007/api/2/search', (req, res, ctx) => {
          const body = req.body as any;
          expect(body.jql).toContain('project = "TEST"');
          expect(body.jql).toContain('statuscategory not in ("Done")');
          expect(body.jql).toContain('component = "backend-component"');
          expect(body.jql).toContain('labels in ("my-label")');
          expect(body.jql).toContain('status in ("In Progress","To Do")');

          return res(
            ctx.json({
              startAt: 0,
              maxResults: 50,
              total: 3,
              issues: [
                {
                  id: '1',
                  key: 'TEST-1',
                  fields: {
                    issuetype: {
                      id: '10001',
                      name: 'Bug',
                    },
                  },
                },
                {
                  id: '2',
                  key: 'TEST-2',
                  fields: {
                    issuetype: {
                      id: '10002',
                      name: 'Task',
                    },
                  },
                },
                {
                  id: '3',
                  key: 'TEST-3',
                  fields: {
                    issuetype: {
                      id: '10002',
                      name: 'Task',
                    },
                  },
                },
              ],
            })
          );
        })
      );

      const issues = await jiraService.getIssues('TEST', 'backend-component', 'my-label', ['In Progress', 'To Do']);
      expect(issues).toEqual({
        projectUrl: 'http://localhost:7007/app/browse/TEST',
        issues: [
          {
            name: 'Bug',
            iconUrl: 'https://example.com/bug-icon.jpg',
            total: 1,
            url: 'http://localhost:7007/app/browse/TEST',
          },
          {
            name: 'Task',
            iconUrl: 'https://example.com/task-icon.jpg',
            total: 2,
            url: 'http://localhost:7007/app/browse/TEST',
          },
        ],
      });
    });
  });
});