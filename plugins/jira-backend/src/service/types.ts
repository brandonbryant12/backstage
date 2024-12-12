import { LoggerService } from '@backstage/backend-plugin-api';
import { Config } from '@backstage/config';

export interface JiraTicketOptions {
  projectKey: string;
  summary: string;
  description: string;
  tag: string;
  feedbackType: string;
  reporter?: string;
  jiraComponent?: string;
}

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

export interface AbstractJiraAPIService {
  createJiraTicket(options: JiraTicketOptions): Promise<any>;
  getTicketDetails(ticketId: string): Promise<JiraTicketDetails | undefined>;
  getIssues(
    projectKey: string,
    component?: string,
    label?: string,
    statusesNames?: string[],
  ): Promise<JiraIssueCounter[]>;
}

export interface JiraServiceOptions {
  logger: LoggerService;
  config: Config;
}