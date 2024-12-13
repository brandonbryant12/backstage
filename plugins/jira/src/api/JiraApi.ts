import { createApiRef } from '@backstage/core-plugin-api';

export interface JiraTicketDetails {
  status: string;
  assignee: string | null;
  avatarUrl: string | null;
}

export interface JiraIssue {
  name: string;
  iconUrl: string;
  total: number;
  url: string;
}

export interface JiraIssues {
  projectUrl: string;
  issues: JiraIssue[];
}

export interface JiraCreateIssueResponse {
  id: string;
  key: string;
  self: string;
}

export interface JiraApi {
  /**
   * Creates a new Jira ticket
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
   */
  getTicketDetails(ticketId: string): Promise<JiraTicketDetails>;

  /**
   * Retrieves issues for a project as a JiraIssues object
   */
  getIssues(
    projectKey: string,
    component?: string,
    label?: string,
    statusesNames?: string[],
  ): Promise<JiraIssues>;
}

export const jiraApiRef = createApiRef<JiraApi>({
  id: 'plugin.jira.api',
});