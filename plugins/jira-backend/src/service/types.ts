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

export interface AbstractJiraAPIService {
  createJiraTicket(options: JiraTicketOptions): Promise<any>;
  getTicketDetails(ticketId: string): Promise<JiraTicketDetails | undefined>;
  getProjectDetails(
    projectKey: string,
    component?: string,
    label?: string,
    statusesNames?: string[],
  ): Promise<JiraProjectDetails>;
}

export interface JiraServiceOptions {
  logger: LoggerService;
  config: Config;
}