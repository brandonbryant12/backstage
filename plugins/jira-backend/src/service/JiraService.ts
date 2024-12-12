import { createServiceFactory, createServiceRef, LoggerService, coreServices } from '@backstage/backend-plugin-api';
import { Config } from '@backstage/config';
import { 
  AbstractJiraAPIService, 
  JiraTicketDetails, 
  JiraTicketOptions, 
  JiraIssueCounter,
  JiraCreateIssueResponse,
  createIssueResponseSchema,
  projectStatusesResponseSchema,
  searchResponseSchema,
} from './types';

export class JiraService implements AbstractJiraAPIService {
  private readonly oauthUrl: string;
  private readonly apiUrl: string;
  private readonly appUrl: string;

  constructor(
    private readonly logger: LoggerService,
    private readonly config: Config,
  ) {
    const baseUrl = process.env.BACKEND_BASEURL || '';
    this.oauthUrl = `${baseUrl}/oauth`;
    this.apiUrl = `${baseUrl}/api/2`;
    this.appUrl = `${baseUrl}/app`;
  }

  private async generateToken(): Promise<string> {
    const clientId = this.config.getString('feedback.jira.clientId');
    const clientSecret = this.config.getString('feedback.jira.clientSecret');
    const response = await fetch(this.oauthUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        grant_type: 'client_credentials',
        client_id: clientId,
        client_secret: clientSecret,
      }),
    });
    const data = await response.json();
    return data.token as string;
  }

  private async makeAuthenticatedRequest(options: {
    method: 'get' | 'post';
    endpoint: string;
    data?: any;
  }) {
    try {
      const jiraServicePat = this.config.getOptionalString('feedback.jira.jiraServicePat');
      const token = await this.generateToken();
      const headers = {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        'x-id-auth': `Bearer ${jiraServicePat}`,
      };
      const url = `${this.apiUrl}/${options.endpoint}`;
      const response = await fetch(url, {
        method: options.method.toUpperCase(),
        headers,
        body: options.data ? JSON.stringify(options.data) : undefined,
      });
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Request failed with status ${response.status}: ${errorText}`);
      }
      return response.json();
    } catch (error: any) {
      this.logger.error(`Jira Service request error: ${options.method.toUpperCase()} ${options.endpoint}: ${error.message}`);
      throw error;
    }
  }

  async createJiraTicket(
    options: JiraTicketOptions
  ): Promise<JiraCreateIssueResponse> {
    const { projectKey, summary, description, reporter, tag, feedbackType } = options;
    const requestBody = {
      fields: {
        project: { key: projectKey },
        reporter: { name: reporter },
        labels: [tag, 'reported-by-backstage'],
        summary,
        description,
        issuetype: {
          name: feedbackType === 'BUG' ? 'Bug' : 'Task',
        },
      },
    };
    const response = await this.makeAuthenticatedRequest({
      method: 'post',
      endpoint: 'issue',
      data: requestBody,
    });
    return createIssueResponseSchema.parse(response);
  }

  async getTicketDetails(ticketId: string): Promise<JiraTicketDetails | undefined> {
    const response = await this.makeAuthenticatedRequest({
      method: 'get',
      endpoint: `issue/${ticketId}`,
    });
    return {
      status: response.fields.status.name,
      assignee: response.fields.assignee
        ? response.fields.assignee.displayName
        : null,
      avatarUrl: response.fields.assignee?.avatarUrls[0] || null,
    };
  }

  getAppUrl(): string {
    return this.appUrl;
  }

  private async getProjectStatuses(projectKey: string) {
    const response = await this.makeAuthenticatedRequest({
      method: 'get',
      endpoint: `project/${projectKey}/statuses`,
    });

    return projectStatusesResponseSchema.parse(response);
  }

  private async searchIssues(jql: string) {
    const response = await this.makeAuthenticatedRequest({
      method: 'post',
      endpoint: 'search',
      data: {
        jql,
        maxResults: -1,
        fields: ['issuetype'],
      },
    });

    return searchResponseSchema.parse(response);
  }

  async getIssues(
    projectKey: string,
    component?: string,
    label?: string,
    statusesNames: string[] = [],
  ): Promise<JiraIssueCounter[]> {
    try {
      const jqlParts = [
        `project = "${projectKey}"`,
        'statuscategory not in ("Done")',
      ];

      if (component) {
        jqlParts.push(`component = "${component}"`);
      }
      if (label) {
        jqlParts.push(`labels in ("${label}")`);
      }
      if (statusesNames.length > 0) {
        jqlParts.push(`status in (${statusesNames.map(s => `"${s}"`).join(',')})`);
      }

      const [statuses, issues] = await Promise.all([
        this.getProjectStatuses(projectKey),
        this.searchIssues(jqlParts.join(' AND ')),
      ]);

      return statuses
        .flatMap(status => status.statuses)
        .filter(status => status.statusCategory?.name !== 'Done')
        .reduce((acc: JiraIssueCounter[], issueType) => {
          const existing = acc.find(counter => counter.name === issueType.name);
          if (!existing) {
            acc.push({
              name: issueType.name,
              iconUrl: issueType.iconUrl || '',
              total: issues.issues.filter(
                issue => issue.fields.issuetype.name === issueType.name,
              ).length,
              url: `${this.getAppUrl()}/browse/${projectKey}`,
            });
          }
          return acc;
        }, []);
    } catch (error: any) {
      this.logger.error(`Failed to get issues: ${error.message}`);
      throw error;
    }
  }
}


export const jiraServiceRef = createServiceRef<AbstractJiraAPIService>({
  id: 'jira.service',
  scope: 'plugin',
  defaultFactory: async (service) => createServiceFactory({
    service,
    deps: {
      logger: coreServices.logger,
      config: coreServices.rootConfig,
    },
    factory({ logger, config }) {
      return new JiraService(logger, config);
    }
  })
});