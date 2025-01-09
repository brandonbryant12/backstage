import { Entity } from '@backstage/catalog-model';
import { DataSource } from '../DataSource';
import { LoggerService, UrlReaderService } from '@backstage/backend-plugin-api';
import {
  ScmIntegrationRegistry,
  GitHubCredentialsProvider,
  GitHubIntegrationConfig,
} from '@backstage/integration';
import pLimit from 'p-limit';
import yaml from 'yaml';
import fetch from 'node-fetch';

/**
 * Represents a minimal GraphQL response shape for repository queries.
 */
interface Repository {
  name: string;
  url: string;
  isArchived: boolean;
  defaultBranchRef?: {
    name: string;
  };
  // We store whether this repo has a HEAD:catalog-info.yaml file or not
  catalogInfo?: {
    id: string | null;
  };
}

/**
 * The shape of page-based results from GitHub.
 */
interface PageInfo {
  hasNextPage: boolean;
  endCursor: string | null;
}

/**
 * The shape of the query response for the list of repositories in an org.
 */
interface RepositoriesResponse {
  repositoryOwner?: {
    repositories: {
      nodes: Repository[];
      pageInfo: PageInfo;
    };
  };
}

/**
 * Basic type for our GraphQL request function
 */
type GraphQLClient = <Response>(
  query: string,
  variables: Record<string, any>,
) => Promise<Response>;

/**
 * Helper that queries the GitHub GraphQL API page by page.
 */
async function queryWithPaging<GraphQLType, OutputType>(
  client: GraphQLClient,
  query: string,
  connection: (response: GraphQLType) => { nodes: any[]; pageInfo: PageInfo },
  mapper: (item: any) => Promise<OutputType>,
  variables: Record<string, any>,
  logger: LoggerService,
  maxPages = 20,
): Promise<OutputType[]> {
  const results: OutputType[] = [];
  let cursor: string | undefined;

  for (let pageIndex = 0; pageIndex < maxPages; pageIndex++) {
    const response = await client<GraphQLType>(query, { ...variables, cursor });
    const conn = connection(response);

    if (!conn) {
      logger.warn(`No data found for queryWithPaging: ${JSON.stringify(variables)}`);
      break;
    }

    logger.debug(`Retrieved page ${pageIndex + 1} of GitHub repos`);

    for (const node of conn.nodes) {
      results.push(await mapper(node));
    }

    if (!conn.pageInfo.hasNextPage || !conn.pageInfo.endCursor) {
      break;
    }
    cursor = conn.pageInfo.endCursor;

    // Sleep to avoid rate-limiting or excessive API usage
    await new Promise(r => setTimeout(r, 500));
  }

  // If we exhaust maxPages, results may be truncated
  if (cursor) {
    logger.warn(`GraphQL results truncated after ${maxPages} pages. Some repos may be missing.`);
  }

  return results;
}

/**
 * GraphQL query that fetches repositories in an org,
 * including HEAD:catalog-info.yaml presence.
 */
const ORG_REPOS_QUERY = `
  query repositories($org: String!, $cursor: String) {
    repositoryOwner(login: $org) {
      repositories(first: 50, after: $cursor) {
        nodes {
          name
          url
          isArchived
          defaultBranchRef {
            name
          }
          catalogInfo: object(expression: "HEAD:catalog-info.yaml") {
            id
          }
        }
        pageInfo {
          hasNextPage
          endCursor
        }
      }
    }
  }
`;

interface GithubDataSourceConfig {
  name: string;
  priority: number;
  refreshSchedule?: { frequency: { seconds: number }; timeout: { minutes: number } };
  ttlSeconds?: number;
  concurrencyLimit?: number;
}

/**
 * GithubDataSource uses GitHub's GraphQL API to discover repositories in an org
 * that contain a HEAD:catalog-info.yaml file, then fetches & parses that file.
 */
export class GithubDataSource extends DataSource {
  private readonly urlReader: UrlReaderService;
  private readonly scmIntegrations: ScmIntegrationRegistry;
  private readonly limit;

  constructor(
    config: GithubDataSourceConfig,
    logger: LoggerService,
    urlReader: UrlReaderService,
    scmIntegrations: ScmIntegrationRegistry,
  ) {
    super(config, logger);
    this.urlReader = urlReader;
    this.scmIntegrations = scmIntegrations;
    this.limit = pLimit(config.concurrencyLimit || 10);
  }

  /**
   * Main refresh method to discover org repos and fetch catalog-info.yaml if present.
   */
  async refresh(provide: (entities: Entity[]) => Promise<void>): Promise<void> {
    try {
      const ghConfigs = this.scmIntegrations.github.list();
      if (!ghConfigs.length) {
        this.logger.warn('No GitHub integrations found, skipping data fetch.');
        return;
      }

      for (const ghConfig of ghConfigs) {
        const org = ghConfig.org;
        if (!org) {
          this.logger.warn(
            `GitHubIntegrationConfig for host=${ghConfig.host} is missing org property.`,
          );
          continue;
        }

        const client = await this.createGraphQLClient(ghConfig, org);
        if (!client) {
          continue;
        }

        const repositories = await this.getOrganizationRepositories(client, org, ghConfig.host);

        if (!repositories.length) {
          this.logger.info(`No repositories with catalog-info.yaml found in org: ${org}`);
          continue;
        }

        const tasks = repositories.map(repo =>
          this.limit(async () => {
            if (repo.isArchived) {
              this.logger.debug(`Skipping archived repo: ${repo.name}`);
              return;
            }
            if (!repo.catalogInfo) {
              this.logger.debug(`Repo ${repo.name} has no catalogInfo, skipping.`);
              return;
            }
            if (!repo.defaultBranchRef?.name) {
              this.logger.debug(`Repo ${repo.name} missing default branch, skipping.`);
              return;
            }
            await this.fetchAndProvideCatalogInfo(
              provide,
              ghConfig,
              org,
              repo.name,
              repo.defaultBranchRef.name,
            );
          }),
        );

        await Promise.all(tasks);
      }
    } catch (error) {
      this.logger.error('Failed to refresh GitHub data source', error as Error);
    }
  }

  /**
   * Build a GitHub GraphQL client using credentials from the integration config.
   */
  private async createGraphQLClient(
    ghConfig: GitHubIntegrationConfig,
    org: string,
  ): Promise<GraphQLClient | null> {
    const credProvider = GitHubCredentialsProvider.create(ghConfig);
    const { token } = await credProvider.getCredentials({
      url: `https://${ghConfig.host}/${org}`,
    });
    if (!ghConfig.apiBaseUrl) {
      this.logger.warn(`No apiBaseUrl set for GitHub host=${ghConfig.host}, skipping org=${org}`);
      return null;
    }

    return async <Response>(query: string, variables: Record<string, any>) => {
      const res = await fetch(`${ghConfig.apiBaseUrl}/graphql`, {
        method: 'POST',
        headers: {
          Authorization: token ? `Bearer ${token}` : '',
          'Content-Type': 'application/json',
          Accept: 'application/vnd.github.v3+json',
        },
        body: JSON.stringify({ query, variables }),
      });
      if (!res.ok) {
        this.logger.warn(
          `GraphQL request failed with status=${res.status}, org=${org}, host=${ghConfig.host}`,
        );
        throw new Error(`GitHub GraphQL error: ${res.status}`);
      }
      return (await res.json()) as Response;
    };
  }

  /**
   * Query the org's repositories via GraphQL, returning only those with HEAD:catalog-info.yaml.
   */
  private async getOrganizationRepositories(
    client: GraphQLClient,
    org: string,
    host: string,
  ): Promise<Repository[]> {
    const repositories = await queryWithPaging<RepositoriesResponse, Repository>(
      client,
      ORG_REPOS_QUERY,
      resp => {
        const owner = resp.repositoryOwner;
        if (!owner || !owner.repositories) {
          return { nodes: [], pageInfo: { hasNextPage: false, endCursor: null } };
        }
        return {
          nodes: owner.repositories.nodes,
          pageInfo: owner.repositories.pageInfo,
        };
      },
      async node => node,
      { org },
      this.logger,
    );

    const final = repositories.filter(
      r => r.catalogInfo !== null && r.catalogInfo !== undefined,
    );

    this.logger.info(
      `Discovered ${final.length} repos in org=${org}, host=${host} containing a HEAD:catalog-info.yaml`,
    );
    return final;
  }

  /**
   * Fetch and parse the catalog-info.yaml file from the specified repo/branch.
   */
  private async fetchAndProvideCatalogInfo(
    provide: (entities: Entity[]) => Promise<void>,
    ghConfig: GitHubIntegrationConfig,
    org: string,
    repoName: string,
    branch: string,
  ): Promise<void> {
    const fileUrl = `${ghConfig.rawBaseUrl}/${org}/${repoName}/${branch}/catalog-info.yaml`;
    this.logger.debug(`Attempting to read file at ${fileUrl}`);

    try {
      const data = await this.urlReader.readUrl(fileUrl);
      const raw = await data.text();
      const parsed = yaml.parse(raw);
      const entities: Entity[] = Array.isArray(parsed) ? parsed : [parsed];

      await provide(entities);
      this.logger.info(
        `Provided ${entities.length} entities from repo=${repoName}, branch=${branch}`,
      );
    } catch (error) {
      this.logger.debug(`Failed to fetch catalog-info.yaml in ${repoName}/${branch}`);
    }
  }
}