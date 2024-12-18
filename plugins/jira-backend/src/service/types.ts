import { LoggerService } from '@backstage/backend-plugin-api';
import { Config } from '@backstage/config';
import { z } from 'zod';

export const issueTypeSchema = z.object({
  self: z.string(),
  id: z.string(),
  description: z.string(),
  iconUrl: z.string(),
  name: z.string(),
  subtask: z.boolean(),
  avatarId: z.number().optional(),
  hierarchyLevel: z.number().optional(),
});

export const projectResponseSchema = z.object({
  issueTypes: z.array(issueTypeSchema),
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
        issuetype: z.object({
          id: z.string(),
          name: z.string(),
          description: z.string().optional(),
        }),
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

export const createTicketSchema = z.object({
  projectKey: z.string(),
  summary: z.string(),
  description: z.string(),
  tag: z.string(),
  feedbackType: z.enum(['BUG', 'TASK']),
  reporter: z.string().optional(),
  jiraComponent: z.string().optional(),
});

export type CreateTicketRequest = z.infer<typeof createTicketSchema>;