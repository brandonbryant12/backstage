import { DiscoveryApi, FetchApi } from '@backstage/core-plugin-api';
import { JiraApi, JiraTicketDetails, JiraCreateIssueResponse, JiraIssues } from './JiraApi';
import { ResponseError } from '@backstage/errors';
import { isJiraAvailable } from '../constants';

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

  static isJiraAvailable = isJiraAvailable;

  private async getBaseUrl() {
    return await this.discoveryApi.getBaseUrl('jira');
  }

  private async fetch<T = any>(input: string, init?: RequestInit): Promise<T> {
    const baseUrl = await this.getBaseUrl();
    const url = `${baseUrl}${input}`;

    const response = await this.fetchApi.fetch(url, init);
    if (!response.ok) {
      const errorText = await response.text();
      const error = await ResponseError.fromResponse(response);
      error.message = `Request failed with ${response.status} ${response.statusText}: ${errorText}`;
      throw error;
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
  }): Promise<JiraCreateIssueResponse> {
    return this.fetch('/tickets', {
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
  }

  async getTicketDetails(ticketId: string): Promise<JiraTicketDetails> {
    return this.fetch(`/tickets/${ticketId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }

  async getIssues(
    projectKey: string,
    component?: string,
    label?: string,
    statusesNames?: string[],
  ): Promise<JiraIssues> {
    return this.fetch('/issues', {
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