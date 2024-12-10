import { DiscoveryApi, FetchApi } from '@backstage/core-plugin-api';
import { JiraApi, JiraTicketDetails, JiraProjectDetails } from './JiraApi';
import { ResponseError } from '@backstage/errors';

export class JiraClient implements JiraApi {
  private readonly discoveryApi: DiscoveryApi;
  private readonly fetchApi: FetchApi;

  constructor(options: {
    discoveryApi: DiscoveryApi;
    fetchApi: FetchApi;
  }) {
    this.discoveryApi = options.discoveryApi;
    this.fetchApi = options.fetchApi;
  }

  private async getBaseUrl() {
    return await this.discoveryApi.getBaseUrl('jira');
  }

  private async fetch<T = any>(input: string, init?: RequestInit): Promise<T> {
    const baseUrl = await this.getBaseUrl();
    const url = `${baseUrl}${input}`;

      const response = await this.fetchApi.fetch(url, init);
      if (!response.ok) {
        throw await ResponseError.fromResponse(response);
      }
      return await response.json();

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
    const response = await this.fetch<{ id: string; key: string; self: string }>('/api/v1/tickets', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        projectKey: options.projectKey,
        summary: options.summary,
        description: options.description,
        reporter: options.reporter,
        tag: options.tag,
        feedbackType: options.feedbackType,
        component: options.jiraComponent,
      }),
    });

    return response;
  }

  async getTicketDetails(ticketId: string): Promise<JiraTicketDetails> {
    return this.fetch(`/api/v1/tickets/${ticketId}`);
  }

  async getProjectDetails(
    projectKey: string,
    component?: string,
    label?: string,
    statusesNames?: string[],
  ): Promise<JiraProjectDetails> {
    return this.fetch('/api/v1/projects/details', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        projectKey,
        component,
        label,
        statusesNames,
      }),
    });
  }
} 