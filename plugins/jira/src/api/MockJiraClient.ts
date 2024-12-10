import { JiraApi, JiraTicketDetails, JiraProjectDetails } from './JiraApi';

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

  async getProjectDetails(
    projectKey: string,
    component?: string,
    label?: string,
    statusesNames?: string[],
  ): Promise<JiraProjectDetails> {
    const project = this.mockProjects.get(projectKey);
    if (!project) {
      return {
        project: {
          name: `Mock Project ${projectKey}`,
          iconUrl: 'https://example.com/project-icon.png',
          type: 'software',
        },
        issues: [
          {
            name: 'Bug',
            iconUrl: 'https://example.com/bug-icon.png',
            total: 1,
          },
        ],
        ticketIds: ['MOCK-1'],
        tickets: [
          {
            key: 'MOCK-1',
            summary: 'Mock Issue',
            assignee: {
              displayName: 'Mock User',
              avatarUrl: 'https://example.com/avatar.png',
            },
            status: 'Open',
            priority: {
              name: 'Medium',
              iconUrl: 'https://example.com/priority-icon.png',
            },
            created: new Date().toISOString(),
            updated: new Date().toISOString(),
          },
        ],
      };
    }

    // Apply filters if provided
    const filteredProject = { ...project };
    if (component || label || statusesNames) {
      filteredProject.tickets = project.tickets.filter(ticket => {
        const matchesComponent = !component || ticket.key.includes(component);
        const matchesLabel = !label || ticket.key.includes(label);
        const matchesStatus = !statusesNames?.length || statusesNames.includes(ticket.status);
        return matchesComponent && matchesLabel && matchesStatus;
      });
      
      filteredProject.ticketIds = filteredProject.tickets.map(t => t.key);
      filteredProject.issues = filteredProject.issues.map(issue => ({
        ...issue,
        total: filteredProject.tickets.length,
      }));
    }

    return filteredProject;
  }
} 