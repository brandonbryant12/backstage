import { LoggerService } from '@backstage/backend-plugin-api';
import { Config } from '@backstage/config';
import { z } from 'zod';

export const statusCategorySchema = z.object({
  id: z.number(),
  key: z.string(),
  name: z.string(),
});

export const statusSchema = z.object({
  id: z.string(),
  name: z.string(),
  iconUrl: z.string().optional(),
  statusCategory: statusCategorySchema,
});

export const projectStatusesResponseSchema = z.array(
  z.object({
    id: z.string(),
    name: z.string(),
    statuses: z.array(statusSchema),
  })
);

export const issueTypeSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().optional(),
});

export const searchResponseSchema = z.object({
  startAt: z.number(),
  maxResults: z.number(),
  total: z.number(),
  issues: z.array(
    z.object({
      id: z.string(),
      key: z.string(),
      fields: z.object({
        issuetype: issueTypeSchema,
      }),
    })
  ),
});

export const createIssueResponseSchema = z.object({
  id: z.string(),
  key: z.string(),
  self: z.string(),
});

export type JiraCreateIssueResponse = z.infer<typeof createIssueResponseSchema>;

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

export interface AbstractJiraAPIService {
  createJiraTicket(options: JiraTicketOptions): Promise<JiraCreateIssueResponse>;
  getTicketDetails(ticketId: string): Promise<JiraTicketDetails | undefined>;
  getIssues(
    projectKey: string,
    component?: string,
    label?: string,
    statusesNames?: string[],
  ): Promise<JiraIssues>;
}

export interface JiraServiceOptions {
  logger: LoggerService;
  config: Config;
}