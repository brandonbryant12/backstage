import { JiraApi, JiraTicketDetails, JiraProjectDetails, JiraIssueCounter } from './JiraApi';

export class MockJiraClient implements JiraApi {
  private mockTickets: Map<string, JiraTicketDetails> = new Map();
  private mockProjects: Map<string, JiraProjectDetails> = new Map();
  private ticketCounter: number = 0;

  // Helper methods for testing
  setMockTicket(ticketId: string, details: JiraTicketDetails) {
    this.mockTickets.set(ticketId, details);
  }

  setMockProject(projectKey: string, details: JiraProjectDetails) {
    this.mockProjects.set(projectKey, details);
  }

  clearMocks() {
    this.mockTickets.clear();
    this.mockProjects.clear();
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
  }) {
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
    const project = this.mockProjects.get(projectKey);
    if (!project) {
      return [
        {
          name: 'Bug',
          iconUrl: 'https://example.com/bug-icon.png',
          total: 1,
          url: `https://example.com/browse/${projectKey}`,
        },
      ];
    }

    let issues = [...project.issues];
    if (component || label || statusesNames) {
      const total = Math.max(1, Math.floor(Math.random() * 5));
      issues = issues.map(issue => ({
        ...issue,
        total,
        url: `https://example.com/browse/${projectKey}`,
      }));
    }

    return issues;
  }
} 