import { createServiceFactory, createServiceRef, LoggerService, coreServices, CacheService } from '@backstage/backend-plugin-api';
import { Config } from '@backstage/config';
import { 
  AbstractJiraAPIService, 
  JiraTicketDetails, 
  JiraTicketOptions, 
  JiraCreateIssueResponse,
  createIssueResponseSchema,
  projectStatusesResponseSchema,
  searchResponseSchema,
  JiraIssues,
} from './types';

interface TokenResponse {
  token: string;
  expires_in: number;
}

export class JiraService implements AbstractJiraAPIService {
  private readonly oauthUrl: string;
  private readonly apiUrl: string;
  private readonly appUrl: string;

  constructor(
    private readonly logger: LoggerService,
    private readonly config: Config,
    private readonly cache: CacheService,
  ) {
    const baseUrl = process.env.BACKEND_BASEURL || '';
    this.oauthUrl = `${baseUrl}/oauth`;
    this.apiUrl = `${baseUrl}/api/2`;
    this.appUrl = `${baseUrl}/app`;
  }

  private async generateToken(): Promise<TokenResponse> {
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
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Token request failed with status ${response.status}: ${errorText}`);
    }
    const data = await response.json();
    const { token, expires_in } = data;
    return { token, expires_in };
  }

  private async getAuthToken(): Promise<string> {
    const cacheKey = 'jira-backend-auth-token';
    const cachedToken = await this.cache.get(cacheKey);
    if (cachedToken) {
      return cachedToken as string;
    }

    const { token, expires_in } = await this.generateToken();
    await this.cache.set(cacheKey, token, { ttl: expires_in - 60 });
    return token;
  }

  private async makeAuthenticatedRequest(options: {
    method: 'get' | 'post';
    endpoint: string;
    data?: any;
  }) {
    try {
      const jiraServicePat = this.config.getOptionalString('feedback.jira.jiraServicePat');
      const token = await this.getAuthToken();
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
  ): Promise<JiraIssues> {
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

      const projectUrl = `${this.getAppUrl()}/browse/${projectKey}`;
      const filteredStatuses = statuses
        .flatMap(status => status.statuses)
        .filter(status => status.statusCategory?.name !== 'Done');

      const issueSummaries = filteredStatuses.reduce((acc: { name: string; iconUrl: string; total: number; url: string; }[], issueType) => {
        const existing = acc.find(counter => counter.name === issueType.name);
        if (!existing) {
          acc.push({
            name: issueType.name,
            iconUrl: issueType.iconUrl || '',
            total: issues.issues.filter(
              issue => issue.fields.issuetype.name === issueType.name,
            ).length,
            url: projectUrl,
          });
        }
        return acc;
      }, []);

      return {
        projectUrl,
        issues: issueSummaries,
      };
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
      cache: coreServices.cache,
    },
    factory({ logger, config, cache }) {
      return new JiraService(logger, config, cache);
    }
  })
});