import { LoggerService } from '@backstage/backend-plugin-api';
import { AbstractJiraAPIService, JiraTicketDetails, JiraIssues } from './types';

export class MockJiraService implements AbstractJiraAPIService {
  private mockTickets: Map<string, JiraTicketDetails> = new Map();
  private ticketCounter: number = 0;

  constructor(private readonly logger: LoggerService) {}

  async createJiraTicket(): Promise<any> {
    this.ticketCounter += 1;
    const ticketId = `MOCK-${this.ticketCounter}`;
    
    const mockTicketDetails: JiraTicketDetails = {
      status: 'Open',
      assignee: 'Mock Assignee',
      avatarUrl: 'https://mock-avatar-url.com/avatar.png',
    };

    this.mockTickets.set(ticketId, mockTicketDetails);

    return {
      id: ticketId,
      key: ticketId,
      self: `https://mock-jira.com/rest/api/2/issue/${ticketId}`,
    };
  }

  async getTicketDetails(ticketId: string): Promise<JiraTicketDetails | undefined> {
    this.logger.info('Getting mock ticket details', { ticketId });
    return this.mockTickets.get(ticketId) || {
      status: 'Not Found',
      assignee: null,
      avatarUrl: null,
    };
  }

  async getIssues(
    projectKey: string,
    component?: string,
    label?: string,
    statusesNames: string[] = [],
  ): Promise<JiraIssues> {
    return {
      projectUrl: `https://mock-jira.com/browse/${projectKey}`,
      issues: [
        {
          name: 'Bug',
          iconUrl: 'https://example.com/bug-icon.png',
          total: 1,
          url: `https://example.com/browse/${projectKey}`,
        },
        {
          name: 'Task',
          iconUrl: 'https://example.com/task-icon.png',
          total: 2,
          url: `https://example.com/browse/${projectKey}`,
        },
      ],
    };
  }

  getAppUrl(): string {
    return 'https://mock-jira.com';
  }
}