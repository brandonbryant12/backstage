import { mockServices } from '@backstage/backend-test-utils';
import { GithubDataSource } from './GithubDataSource';
import { LoggerService, UrlReaderService } from '@backstage/backend-plugin-api';
import { ScmIntegrationRegistry } from '@backstage/integration';
import fetch from 'node-fetch';
import yaml from 'yaml';
import { Entity } from '@backstage/catalog-model';

jest.mock('node-fetch', () => jest.fn());

describe('GithubDataSource', () => {
  let logger: jest.Mocked<LoggerService>;
  let urlReader: jest.Mocked<UrlReaderService>;
  let scmIntegrations: jest.Mocked<ScmIntegrationRegistry>;

  beforeEach(() => {
    logger = mockServices.logger.mock();
    urlReader = {
      readUrl: jest.fn(),
      readTree: jest.fn(),
      search: jest.fn(),
    } as any;

    scmIntegrations = {
      github: {
        list: jest.fn(),
      },
    } as any;

    (fetch as jest.Mock).mockReset();
  });

  it('logs a warning if no GitHub integrations found', async () => {
    scmIntegrations.github.list.mockReturnValue([]);
    const ds = new GithubDataSource({ name: 'gh', priority: 100 }, logger, urlReader, scmIntegrations);

    const provide = jest.fn();
    await ds.refresh(provide);

    expect(logger.warn).toHaveBeenCalledWith('No GitHub integrations found, skipping data fetch.');
    expect(provide).not.toHaveBeenCalled();
  });

  it('skips if integration config has no org', async () => {
    scmIntegrations.github.list.mockReturnValue([
      { host: 'github.com', apiBaseUrl: 'https://api.github.com' } as any,
    ]);

    const ds = new GithubDataSource({ name: 'gh', priority: 100 }, logger, urlReader, scmIntegrations);

    const provide = jest.fn();
    await ds.refresh(provide);

    expect(logger.warn).toHaveBeenCalledWith(
      expect.stringContaining('missing org property'),
    );
    expect(provide).not.toHaveBeenCalled();
  });

  it('skips if apiBaseUrl is not set', async () => {
    scmIntegrations.github.list.mockReturnValue([
      { host: 'github.com', org: 'test-org', apiBaseUrl: undefined } as any,
    ]);

    const ds = new GithubDataSource({ name: 'gh', priority: 100 }, logger, urlReader, scmIntegrations);

    const provide = jest.fn();
    await ds.refresh(provide);

    expect(logger.warn).toHaveBeenCalledWith(
      expect.stringContaining('No apiBaseUrl set for GitHub host=github.com'),
    );
    expect(provide).not.toHaveBeenCalled();
  });

  it('queries org repositories, logs if none found', async () => {
    scmIntegrations.github.list.mockReturnValue([
      {
        host: 'github.com',
        org: 'test-org',
        apiBaseUrl: 'https://api.github.com',
        rawBaseUrl: 'https://raw.githubusercontent.com',
      } as any,
    ]);

    (fetch as jest.Mock).mockImplementation(async (url: string) => {
      if (url.endsWith('/graphql')) {
        return {
          ok: true,
          json: async () => ({
            data: {
              repositoryOwner: {
                repositories: {
                  nodes: [],
                  pageInfo: { hasNextPage: false, endCursor: null },
                },
              },
            },
          }),
        };
      }
      throw new Error('Unexpected fetch call');
    });

    const ds = new GithubDataSource({ name: 'gh', priority: 100 }, logger, urlReader, scmIntegrations);
    const provide = jest.fn();

    await ds.refresh(provide);

    expect(logger.info).toHaveBeenCalledWith(
      'No repositories with catalog-info.yaml found in org: test-org',
    );
    expect(provide).not.toHaveBeenCalled();
  });

  it('queries org repositories and fetches catalog-info.yaml', async () => {
    scmIntegrations.github.list.mockReturnValue([
      {
        host: 'github.com',
        org: 'test-org',
        apiBaseUrl: 'https://api.github.com',
        rawBaseUrl: 'https://raw.githubusercontent.com',
      } as any,
    ]);

    (fetch as jest.Mock).mockImplementation(async (url: string, options: any) => {
      if (url.includes('/graphql')) {
        return {
          ok: true,
          json: async () => ({
            data: {
              repositoryOwner: {
                repositories: {
                  nodes: [
                    {
                      name: 'repoA',
                      url: 'https://github.com/test-org/repoA',
                      isArchived: false,
                      defaultBranchRef: { name: 'main' },
                      catalogInfo: { id: 'some-id' },
                    },
                  ],
                  pageInfo: { hasNextPage: false, endCursor: null },
                },
              },
            },
          }),
        };
      }
      throw new Error(`Unexpected fetch call: ${url}`);
    });

    urlReader.readUrl.mockResolvedValue({
      text: async () => `kind: Component\nmetadata:\n  name: from-repoA`,
    } as any);

    const ds = new GithubDataSource({ name: 'gh', priority: 100 }, logger, urlReader, scmIntegrations);
    const provide = jest.fn();

    await ds.refresh(provide);
    expect(provide).toHaveBeenCalledWith([
      expect.objectContaining<Entity>({ kind: 'Component', metadata: { name: 'from-repoA' } }),
    ]);
    expect(logger.info).toHaveBeenCalledWith(
      expect.stringContaining('Provided 1 entities from repo=repoA'),
    );
  });

  it('honors concurrencyLimit in config', async () => {
    scmIntegrations.github.list.mockReturnValue([
      {
        host: 'github.com',
        org: 'test-org',
        apiBaseUrl: 'https://api.github.com',
        rawBaseUrl: 'https://raw.githubusercontent.com',
      } as any,
    ]);

    (fetch as jest.Mock).mockImplementation(async (url: string) => ({
      ok: true,
      json: async () => ({
        data: {
          repositoryOwner: {
            repositories: {
              nodes: [
                { name: 'repo1', isArchived: false, defaultBranchRef: { name: 'main' }, catalogInfo: { id: 'some-id' } },
                { name: 'repo2', isArchived: false, defaultBranchRef: { name: 'main' }, catalogInfo: { id: 'some-id' } },
                { name: 'repo3', isArchived: false, defaultBranchRef: { name: 'main' }, catalogInfo: { id: 'some-id' } },
              ],
              pageInfo: { hasNextPage: false, endCursor: null },
            },
          },
        },
      }),
    }));

    urlReader.readUrl.mockResolvedValue({
      text: async () => `kind: Component\nmetadata:\n  name: test-repo`,
    } as any);

    const ds = new GithubDataSource(
      {
        name: 'gh',
        priority: 100,
        concurrencyLimit: 1,
      },
      logger,
      urlReader,
      scmIntegrations,
    );

    const provide = jest.fn();
    await ds.refresh(provide);

    // concurrencyLimit=1 means tasks run sequentially
    expect(provide).toHaveBeenCalledTimes(3);
    expect(logger.info).toHaveBeenCalledWith(
      expect.stringContaining('Provided 1 entities from repo=repo3'),
    );
  });

  it('logs error if top-level refresh fails', async () => {
    scmIntegrations.github.list.mockImplementation(() => {
      throw new Error('Integration config error');
    });
    const ds = new GithubDataSource({ name: 'gh', priority: 100 }, logger, urlReader, scmIntegrations);

    const provide = jest.fn();
    await ds.refresh(provide);
    expect(logger.error).toHaveBeenCalledWith(
      'Failed to refresh GitHub data source',
      expect.any(Error),
    );
  });
});