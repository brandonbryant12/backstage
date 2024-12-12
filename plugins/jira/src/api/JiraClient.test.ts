import { MockFetchApi } from '@backstage/test-utils';
import { JiraClient } from './JiraClient';
import { DiscoveryApi } from '@backstage/core-plugin-api';

describe('JiraClient', () => {
  const mockFetch = jest.fn().mockName('fetch');
  const mockFetchApi = new MockFetchApi({ baseImplementation: mockFetch });
  const mockDiscoveryApi: DiscoveryApi = {
    async getBaseUrl(pluginId: string): Promise<string> {
      return `http://localhost:7007/api/${pluginId}`;
    },
  };

  let client: JiraClient;

  beforeEach(() => {
    client = new JiraClient({
      discoveryApi: mockDiscoveryApi,
      fetchApi: mockFetchApi,
    });
    mockFetch.mockReset();
  });

  describe('createTicket', () => {
    it('should create a ticket successfully', async () => {
      const mockResponse = {
        id: '12345',
        key: 'TEST-123',
        self: 'http://jira.example.com/rest/api/2/issue/12345',
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await client.createTicket({
        projectKey: 'TEST',
        summary: 'Test Issue',
        description: 'Test Description',
        reporter: 'test-user',
        tag: 'test-tag',
        feedbackType: 'BUG',
      });

      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:7007/api/jira/tickets',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({
            projectKey: 'TEST',
            summary: 'Test Issue',
            description: 'Test Description',
            reporter: 'test-user',
            tag: 'test-tag',
            feedbackType: 'BUG',
            component: undefined,
          }),
        }),
      );

      expect(result).toEqual(mockResponse);
    });
  });

  describe('getTicketDetails', () => {
    it('should fetch ticket details successfully', async () => {
      const mockResponse = {
        status: 'In Progress',
        assignee: 'John Doe',
        avatarUrl: 'https://example.com/avatar.jpg',
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await client.getTicketDetails('TEST-123');

      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:7007/api/jira/tickets/TEST-123',
        expect.objectContaining({
          method: 'GET',
        }),
      );

      expect(result).toEqual(mockResponse);
    });
  });

  describe('getIssues', () => {
    it('should fetch issues successfully', async () => {
      const mockResponse = [
        {
          name: 'Bug',
          iconUrl: 'https://example.com/bug-icon.jpg',
          total: 1,
          url: 'http://localhost:7007/app/browse/TEST',
        },
      ];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await client.getIssues('TEST');

      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:7007/api/jira/issues',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({
            projectKey: 'TEST',
            component: undefined,
            label: undefined,
            statusesNames: undefined,
          }),
        }),
      );

      expect(result).toEqual(mockResponse);
    });

    it('should handle errors', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        statusText: 'Bad Request',
        text: async () => 'Invalid project key',
        headers: new Headers({ 'content-type': 'text/plain' }),
      });

      await expect(client.getIssues('INVALID')).rejects.toThrow(
        'Request failed with 400 Bad Request: Invalid project key'
      );
    });
  });
}); 