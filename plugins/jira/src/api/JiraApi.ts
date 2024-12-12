import { createApiRef } from '@backstage/core-plugin-api';

export interface JiraTicketDetails {
  status: string;
  assignee: string | null;
  avatarUrl: string | null;
}

export interface JiraIssueCounter {
  name: string;
  iconUrl: string;
  total: number;
  url: string;
}

export interface JiraCreateIssueResponse {
  id: string;
  key: string;
  self: string;
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
  }): Promise<JiraCreateIssueResponse>;

  /**
   * Retrieves details for a specific Jira ticket
   * @param ticketId - The ID of the ticket to retrieve
   * @throws {Error} If the ticket retrieval fails
   */
  getTicketDetails(ticketId: string): Promise<JiraTicketDetails>;

  /**
   * Retrieves issues for a project
   * @param projectKey - The key of the project to retrieve
   * @param component - Optional component filter
   * @param label - Optional label filter
   * @param statusesNames - Optional status names filter
   * @throws {Error} If the issues retrieval fails
   */
  getIssues(
    projectKey: string,
    component?: string,
    label?: string,
    statusesNames?: string[],
  ): Promise<JiraIssueCounter[]>;
}

export const jiraApiRef = createApiRef<JiraApi>({
  id: 'plugin.jira.api',
}); 