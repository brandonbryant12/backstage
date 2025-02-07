import { Entity, getCompoundEntityRef } from '@backstage/catalog-model';
import crypto from 'crypto';
import { CatalogClient } from '@backstage/catalog-client';
import { LoggerService } from '@backstage/backend-plugin-api';

const TIMESTAMP_ANNOTATIONS = {
  CREATED_AT: 'backstage.io/created-at',
  UPDATED_AT: 'backstage.io/updated-at',
} as const;

/**
 * Creates a hashable representation of an entity by including only core fields.
 */
function createHashableEntity(entity: Entity): Partial<Entity> {
  const { apiVersion, kind, spec, metadata } = entity;
  const annotations =
    metadata.annotations && removeTimestampAnnotations(metadata.annotations);

  return {
    apiVersion,
    kind,
    spec,
    metadata: {
      ...metadata,
      annotations:
        annotations && Object.keys(annotations).length > 0 ? annotations : undefined,
    },
  };
}

/**
 * Creates a new annotations object without timestamp annotations.
 */
function removeTimestampAnnotations(
  annotations: Record<string, string>,
): Record<string, string> {
  return Object.fromEntries(
    Object.entries(annotations).filter(
      ([key]) =>
        key !== TIMESTAMP_ANNOTATIONS.CREATED_AT &&
        key !== TIMESTAMP_ANNOTATIONS.UPDATED_AT,
    ),
  );
}

/**
 * Generates a hash of the entity's core content.
 */
function computeEntityHash(entity: Entity): string {
  const hashableData = createHashableEntity(entity);
  return crypto
    .createHash('sha256')
    .update(JSON.stringify(hashableData))
    .digest('hex');
}

/**
 * Creates new timestamp annotations for a new entity.
 */
function createNewEntityTimestamps(currentTime: string): Record<string, string> {
  return {
    [TIMESTAMP_ANNOTATIONS.CREATED_AT]: currentTime,
    [TIMESTAMP_ANNOTATIONS.UPDATED_AT]: currentTime,
  };
}

function createUpdatedEntityTimestamps(
  currentAnnotations: Record<string, string>,
  existingAnnotations: Record<string, string> = {},
  currentTime: string,
  hasContentChanged: boolean,
): Record<string, string> {
  return {
    ...currentAnnotations,
    [TIMESTAMP_ANNOTATIONS.CREATED_AT]:
      existingAnnotations[TIMESTAMP_ANNOTATIONS.CREATED_AT] || currentTime,
    [TIMESTAMP_ANNOTATIONS.UPDATED_AT]: hasContentChanged
      ? currentTime
      : existingAnnotations[TIMESTAMP_ANNOTATIONS.UPDATED_AT] || currentTime,
  };
}

/**
 * Adds or updates timestamp annotations on an entity.
 */
export async function timestampEntity(
  entity: Entity,
  catalogClient: CatalogClient,
  logger: LoggerService,
): Promise<Entity> {
  const currentTime = new Date().toISOString();
  const entityRef = getCompoundEntityRef(entity);
  const incomingHash = computeEntityHash(entity);
  const currentAnnotations = entity.metadata.annotations || {};

  let existingEntity;
  try {
    existingEntity = await catalogClient.getEntityByRef(entityRef);
  } catch (error) {
    const formattedRef = `${entity.kind}:${entity.metadata.namespace}/${entity.metadata.name}`.toLocaleLowerCase();
    logger.error(`Error fetching entity ${formattedRef} from CatalogClient:`, error as Error);
  }

  const newAnnotations = !existingEntity
    ? { ...currentAnnotations, ...createNewEntityTimestamps(currentTime) }
    : createUpdatedEntityTimestamps(
        currentAnnotations,
        existingEntity?.metadata?.annotations,
        currentTime,
        !!existingEntity && computeEntityHash(existingEntity) !== incomingHash,
      );

  return {
    ...entity,
    metadata: {
      ...entity.metadata,
      annotations: newAnnotations,
    },
  };
}