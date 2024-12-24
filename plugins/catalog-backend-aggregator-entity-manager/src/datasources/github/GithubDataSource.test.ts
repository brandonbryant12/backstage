import { mockServices } from '@backstage/backend-test-utils';
import { GithubDataSource } from './GithubDataSource';
import { LoggerService, UrlReaderService } from '@backstage/backend-plugin-api';
import { Entity } from '@backstage/catalog-model';

describe('GithubDataSource', () => {
  let logger: LoggerService;
  let urlReader: UrlReaderService;
  const mockUrls = ['https://example.com/catalog-info.yaml'];

  const mockYamlContent = `---
# Main Application
apiVersion: backstage.io/v1alpha1
kind: Component
metadata:
  name: example
  description: An example of a Backstage application.
  annotations:
    github.com/project-slug: example/example-app
    backstage.io/techdocs-ref: dir:.
  tags:
    - typescript
    - web
spec:
  type: website
  owner: team-a
  lifecycle: experimental
  system: example-system
  dependsOn:
    - resource:example-db
    - component:auth-service
---
# Database
apiVersion: backstage.io/v1alpha1
kind: Resource
metadata:
  name: example-db
  description: Main application database
  annotations:
    backstage.io/managed-by: aws
spec:
  type: database
  owner: team-a
  system: example-system`;

  beforeEach(() => {
    logger = mockServices.logger.mock();
    urlReader = {
      readUrl: jest.fn().mockResolvedValue({
        buffer: jest.fn().mockResolvedValue(Buffer.from(mockYamlContent)),
      }),
      readTree: jest.fn(),
      search: jest.fn(),
    };
  });

  it('returns mocked target URLs', () => {
    const ds = new GithubDataSource({
      name: 'github-source',
      priority: 100,
    }, logger, urlReader);

    jest.spyOn(ds, 'getAllTargetUrls').mockReturnValue(mockUrls);

    const urls = ds.getAllTargetUrls();
    expect(urls).toEqual(mockUrls);
    expect(urls).toHaveLength(1);
  });

  it('refreshes entities and provides them', async () => {
    const ds = new GithubDataSource({
      name: 'github-source',
      priority: 100,
      refreshSchedule: { frequency: { seconds: 10 }, timeout: { minutes: 10 } },
      ttlSeconds: 60,
    }, logger, urlReader);

    jest.spyOn(ds, 'getAllTargetUrls').mockReturnValue(mockUrls);

    const provide = jest.fn().mockResolvedValue(undefined);
    await ds.refresh(provide);
    
    const providedEntities = provide.mock.calls[0][0];
    
    expect(providedEntities[0]).toEqual(
      expect.objectContaining({
        apiVersion: "backstage.io/v1alpha1",
        kind: 'Component',
        metadata: expect.objectContaining({
          name: 'example',
          annotations: expect.objectContaining({
            'github.com/project-slug': 'example/example-app',
          }),
        }),
        spec: expect.objectContaining({
          type: 'website',
          owner: 'team-a',
          system: 'example-system',
        })
      })
    );

    expect(providedEntities[1]).toEqual(
      expect.objectContaining({
        apiVersion: "backstage.io/v1alpha1",
        kind: 'Resource',
        metadata: expect.objectContaining({
          name: 'example-db',
          annotations: expect.objectContaining({
            'backstage.io/managed-by': 'aws',
          }),
        }),
        spec: expect.objectContaining({
          type: 'database',
          owner: 'team-a',
          system: 'example-system',
        })
      })
    );

    expect(providedEntities).toHaveLength(2);
    expect(provide).toHaveBeenCalledTimes(1);
    expect(urlReader.readUrl).toHaveBeenCalledWith(mockUrls[0]);
  });

  it('handles errors gracefully', async () => {
    urlReader.readUrl = jest.fn().mockRejectedValue(new Error('Failed to fetch'));

    const ds = new GithubDataSource({
      name: 'github-source',
      priority: 100,
    }, logger, urlReader);

    jest.spyOn(ds, 'getAllTargetUrls').mockReturnValue(mockUrls);

    const provide = jest.fn();
    await ds.refresh(provide);

    expect(provide).not.toHaveBeenCalled();
    expect(logger.error).toHaveBeenCalled();
  });
});