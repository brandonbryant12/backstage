import { TemplateTimestampProcessor } from './processor';
import { Entity } from '@backstage/catalog-model';
import { CatalogClient } from '@backstage/catalog-client';
import { mockServices } from '@backstage/backend-test-utils';
import { LoggerService } from '@backstage/backend-plugin-api/index';

describe('TemplateTimestampProcessor', () => {
  const mockGetEntityByRef = jest.fn();
  const mockCatalogClient = {
    getEntityByRef: mockGetEntityByRef,
  } as unknown as CatalogClient;
  const fixedTime = '2024-02-07T12:00:00.000Z';
  let logger: LoggerService

  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date(fixedTime));
    mockGetEntityByRef.mockReset();
    logger = mockServices.logger.mock()
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('should get processor name', async () => {
    const processor = new TemplateTimestampProcessor(mockCatalogClient, logger);
    
    const name = processor.getProcessorName();

    expect(name).toBe('TemplateTimestampProcessor')
  });

  it('should add timestamps to a new Template entity', async () => {
    const processor = new TemplateTimestampProcessor(mockCatalogClient, logger);
    const entity: Entity = {
      apiVersion: 'scaffolder.backstage.io/v1beta3',
      kind: 'Template',
      metadata: {
        name: 'test-template',
        namespace: 'default',
      },
      spec: {},
    };

    mockGetEntityByRef.mockImplementation(() => Promise.resolve(undefined));

    const result = await processor.preProcessEntity(entity);

    expect(result.metadata.annotations?.['backstage.io/created-at']).toBe(fixedTime);
    expect(result.metadata.annotations?.['backstage.io/updated-at']).toBe(fixedTime);
  });

  it('should not process non-Template entity', async () => {
    const processor = new TemplateTimestampProcessor(mockCatalogClient, logger);
    const entity: Entity = {
      apiVersion: 'backstage.io/v1beta1',
      kind: 'Component',
      metadata: {
        name: 'test-component',
        namespace: 'default',
      },
      spec: {},
    };

    const result = await processor.preProcessEntity(entity);
    expect(result).toEqual(entity);
  });
});