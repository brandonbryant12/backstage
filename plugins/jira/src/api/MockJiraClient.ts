import { JiraApi, JiraTicketDetails, JiraCreateIssueResponse, JiraIssues } from './JiraApi';

export class MockJiraClient implements JiraApi {
  private mockTickets: Map<string, JiraTicketDetails> = new Map();
  private ticketCounter: number = 0;
  setMockTicket(ticketId: string, details: JiraTicketDetails) {
    this.mockTickets.set(ticketId, details);
  }

  clearMocks() {
    this.mockTickets.clear();
    this.ticketCounter = 0;
  }

  async createTicket(options: {
    projectKey: string;
    summary: string;
    description: string;
    tag: string;
    feedbackType: string;
    reporter?: string;
    jiraComponent?: string;
  }): Promise<JiraCreateIssueResponse> {
    this.ticketCounter += 1;
    const ticketId = `MOCK-${this.ticketCounter}`;

    const mockTicketDetails: JiraTicketDetails = {
      status: 'Open',
      assignee: options.reporter || null,
      avatarUrl: 'https://example.com/avatar.png',
    };

    this.mockTickets.set(ticketId, mockTicketDetails);

    return {
      id: ticketId,
      key: ticketId,
      self: `https://example.com/jira/browse/${ticketId}`,
    };
  }

  async getTicketDetails(ticketId: string): Promise<JiraTicketDetails> {
    const ticket = this.mockTickets.get(ticketId);
    if (!ticket) {
      throw new Error(`Ticket ${ticketId} not found`);
    }
    return ticket;
  }

  async getIssues(
    projectKey: string,
    component?: string,
    label?: string,
    statusesNames?: string[],
  ): Promise<JiraIssues> {
    return {
      projectUrl: `https://example.com/browse/${projectKey}`,
      issues: [
        {
          name: 'Bug',
          iconUrl: 'https://product-integrations-cdn.atl-paas.net/jira-issuetype/bug.png',
          total: 1,
          url: `https://example.com/browse/${projectKey}`,
        },
        {
          name: 'Task',
          iconUrl: 'https://product-integrations-cdn.atl-paas.net/jira-issuetype/task.png',
          total: 2,
          url: `https://example.com/browse/${projectKey}`,
        },
      ],
    };
  }
  
}