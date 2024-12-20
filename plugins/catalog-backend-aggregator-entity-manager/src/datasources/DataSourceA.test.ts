import { mockServices } from '@backstage/backend-test-utils';
import { DataSourceA } from './DataSourceA';
import { LoggerService } from '@backstage/backend-plugin-api';

describe('DataSourceA', () => {
  let logger: LoggerService;

  beforeEach(() => {
    logger = mockServices.logger.mock();
  });

  it('refreshes entities and provides them', async () => {
    const ds = new DataSourceA({
      name: 'datasource-a',
      priority: 100,
      refreshSchedule: { frequency: { seconds: 10 }, timeout: { minutes: 10 } },
      ttlSeconds: 60,
    }, logger);

    const provide = jest.fn().mockResolvedValue(undefined);
    await ds.refresh(provide);
    
    const providedEntities = provide.mock.calls[0][0];
    expect(providedEntities[0]).toEqual(
      expect.objectContaining({
        apiVersion: "backstage.io/v1alpha1",
        kind: 'Component',
        metadata: expect.objectContaining({
          labels: expect.objectContaining({
            tier: 'frontend',
          }),
        }),
        spec: expect.objectContaining({
          type: 'service',
          owner: 'team-a',
        })
      })
    );

    expect(providedEntities).toHaveLength(30);
    expect(provide).toHaveBeenCalledTimes(1);
  });
});