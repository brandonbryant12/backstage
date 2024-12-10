import { createApiRef } from '@backstage/core-plugin-api';

export interface JiraTicketDetails {
  status: string;
  assignee: string | null;
  avatarUrl: string | null;
}

export interface JiraProjectDetails {
  project: {
    name: string;
    iconUrl: string;
    type: string;
  };
  issues: Array<{
    name: string;
    iconUrl: string;
    total: number;
  }>;
  ticketIds: string[];
  tickets: Array<{
    key: string;
    summary: string;
    assignee: {
      displayName: string | null;
      avatarUrl: string | null;
    };
    status: string;
    priority: {
      name: string;
      iconUrl: string;
    };
    created: string;
    updated: string;
  }>;
}

export interface JiraApi {
  /**
   * Creates a new Jira ticket
   * @param options - The ticket creation options
   * @throws {Error} If the ticket creation fails
   */
  createTicket(options: {
    projectKey: string;
    summary: string;
    description: string;
    tag: string;
    feedbackType: string;
    reporter?: string;
    jiraComponent?: string;
  }): Promise<{
    id: string;
    key: string;
    self: string;
  }>;

  /**
   * Retrieves details for a specific Jira ticket
   * @param ticketId - The ID of the ticket to retrieve
   * @throws {Error} If the ticket retrieval fails
   */
  getTicketDetails(ticketId: string): Promise<JiraTicketDetails>;

  /**
   * Retrieves project details including issues and tickets
   * @param projectKey - The key of the project to retrieve
   * @param component - Optional component filter
   * @param label - Optional label filter
   * @param statusesNames - Optional status names filter
   * @throws {Error} If the project details retrieval fails
   */
  getProjectDetails(
    projectKey: string,
    component?: string,
    label?: string,
    statusesNames?: string[],
  ): Promise<JiraProjectDetails>;
}

export const jiraApiRef = createApiRef<JiraApi>({
  id: 'plugin.jira.api',
}); 