import { timestampEntity } from './timestampEntity';
import { Entity } from '@backstage/catalog-model';
import { CatalogClient } from '@backstage/catalog-client';
import { mockServices } from '@backstage/backend-test-utils';
import { LoggerService } from '@backstage/backend-plugin-api/index';

describe('timestampEntity', () => {
  const mockGetEntityByRef = jest.fn();
  const fixedTime = '2025-01-31T00:00:00.000Z';
  const newTime = '2025-01-31T01:00:00.000Z';
  let catalogClientMock: CatalogClient;
  let logger: LoggerService
  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date(fixedTime));
    mockGetEntityByRef.mockReset();

    catalogClientMock = {
      getEntityByRef: mockGetEntityByRef,
    } as unknown as CatalogClient;

    // Mock logger from @backstage/backend-test-utils
    logger = mockServices.logger.mock()
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  test('should preserve existing annotations when adding timestamps', async () => {
    const entity: Entity = {
      apiVersion: 'backstage.io/v1alpha1',
      kind: 'Component',
      metadata: {
        name: 'test',
        namespace: 'default',
        annotations: {
          'existing-annotation': 'value',
        },
      },
      spec: { type: 'service' },
    };

    mockGetEntityByRef.mockResolvedValueOnce(undefined);

    const result = await timestampEntity(entity, catalogClientMock, logger);
    expect(result.metadata.annotations).toBeDefined();
    expect(result.metadata.annotations!['backstage.io/created-at']).toBe(fixedTime);
    expect(result.metadata.annotations!['backstage.io/updated-at']).toBe(fixedTime);
    expect(result.metadata.annotations!['existing-annotation']).toBe('value');
  });

  test('should set timestamps for new entity', async () => {
    const entity: Entity = {
      apiVersion: 'backstage.io/v1alpha1',
      kind: 'Component',
      metadata: {
        name: 'test',
        namespace: 'default',
        annotations: {},
      },
      spec: { type: 'service' },
    };

    mockGetEntityByRef.mockResolvedValueOnce(undefined);

    const result = await timestampEntity(entity, catalogClientMock, logger);
    expect(result.metadata.annotations).toBeDefined();
    expect(result.metadata.annotations!['backstage.io/created-at']).toBe(fixedTime);
    expect(result.metadata.annotations!['backstage.io/updated-at']).toBe(fixedTime);
  });

  test('should preserve timestamps when entity is unchanged', async () => {
    const existingEntity: Entity = {
      apiVersion: 'backstage.io/v1alpha1',
      kind: 'Component',
      metadata: {
        name: 'test',
        namespace: 'default',
        annotations: {
          'backstage.io/created-at': fixedTime,
          'backstage.io/updated-at': fixedTime,
        },
      },
      spec: { type: 'service' },
    };

    const entity: Entity = {
      apiVersion: 'backstage.io/v1alpha1',
      kind: 'Component',
      metadata: {
        name: 'test',
        namespace: 'default',
        annotations: {},
      },
      spec: { type: 'service' },
    };

    mockGetEntityByRef.mockResolvedValueOnce(existingEntity);

    const result = await timestampEntity(entity, catalogClientMock, logger);
    expect(result.metadata.annotations).toBeDefined();
    expect(result.metadata.annotations!['backstage.io/created-at']).toBe(fixedTime);
    expect(result.metadata.annotations!['backstage.io/updated-at']).toBe(fixedTime);
  });

  test('should preserve existing created-at when entity has changed', async () => {
    const existingEntity: Entity = {
      apiVersion: 'backstage.io/v1alpha1',
      kind: 'Component',
      metadata: {
        name: 'test',
        namespace: 'default',
        annotations: {
          'backstage.io/created-at': fixedTime,
          'backstage.io/updated-at': fixedTime,
        },
      },
      spec: { type: 'service', version: '1.0' },
    };

    const entity: Entity = {
      apiVersion: 'backstage.io/v1alpha1',
      kind: 'Component',
      metadata: {
        name: 'test',
        namespace: 'default',
        annotations: {},
      },
      spec: { type: 'service', version: '2.0' },
    };

    mockGetEntityByRef.mockResolvedValueOnce(existingEntity);
    jest.setSystemTime(new Date(newTime));

    const result = await timestampEntity(entity, catalogClientMock, logger);
    expect(result.metadata.annotations).toBeDefined();
    expect(result.metadata.annotations!['backstage.io/created-at']).toBe(fixedTime);
    expect(result.metadata.annotations!['backstage.io/updated-at']).toBe(newTime);
  });

  test('should handle error fetching existing entity', async () => {
    const entity: Entity = {
      apiVersion: 'backstage.io/v1alpha1',
      kind: 'Component',
      metadata: {
        name: 'test',
        namespace: 'default',
        annotations: {},
      },
      spec: { type: 'service' },
    };

    const error = new Error('Not found');
    mockGetEntityByRef.mockRejectedValueOnce(error);

    const result = await timestampEntity(entity, catalogClientMock, logger);

    // The line of code for logger.error should now be covered
    expect(logger.error).toHaveBeenCalledWith(
      'Error fetching entity component:default/test from CatalogClient:',
      error,
    );
    expect(result.metadata.annotations).toBeDefined();
    expect(result.metadata.annotations!['backstage.io/created-at']).toBe(fixedTime);
    expect(result.metadata.annotations!['backstage.io/updated-at']).toBe(fixedTime);
  });

  test('should handle existing entity missing metadata or annotations', async () => {
    const existingEntity: Entity = {
      apiVersion: 'backstage.io/v1alpha1',
      kind: 'Component',
      metadata: {
        name: 'test',
        namespace: 'default',
      },
      spec: { type: 'service' },
    };

    mockGetEntityByRef.mockResolvedValueOnce(existingEntity);

    const entity: Entity = {
      apiVersion: 'backstage.io/v1alpha1',
      kind: 'Component',
      metadata: {
        name: 'test',
        namespace: 'default',
        annotations: {},
      },
      spec: { type: 'service' },
    };

    // This verifies coverage for lines that handle potentially undefined existingEntity.metadata.annotations
    const result = await timestampEntity(entity, catalogClientMock, logger);
    expect(result.metadata.annotations).toBeDefined();
    expect(result.metadata.annotations!['backstage.io/created-at']).toBe(fixedTime);
    expect(result.metadata.annotations!['backstage.io/updated-at']).toBe(fixedTime);
  });
});
