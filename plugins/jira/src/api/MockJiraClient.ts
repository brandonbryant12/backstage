import { JiraApi, JiraTicketDetails, JiraCreateIssueResponse, JiraIssueCounter } from './JiraApi';

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
  ): Promise<JiraIssueCounter[]> {
    const mockIssues: JiraIssueCounter[] = [
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
    ];
    if (component || label || statusesNames) {
      return mockIssues.map(issue => ({
        ...issue,
        total: Math.max(1, Math.floor(Math.random() * 5)),
      }));
    }

    return mockIssues;
  }
} 