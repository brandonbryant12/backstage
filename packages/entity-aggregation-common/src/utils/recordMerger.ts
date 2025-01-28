import _ from 'lodash';
import { type EntityFragmentRecord } from '@core/plugin-catalog-backend-module-aggregator-entity-manager';
import { Entity } from '@backstage/catalog-model';

const ARRAY_PATHS = {
  metadata: ['tags', 'links'],
  spec: ['implementsApis', 'consumesApis', 'providesApis', 'dependsOn', 'systems', 'owner']
} as const;

export type EntityRecord = Entity & {
  dataSource: string;
  entityRef: string;
  priority: number;
  providerId: string;
};

export function mergeRecords(records: EntityFragmentRecord[]): Entity {
  if (_.isEmpty(records)) {
    throw new Error('Cannot merge empty records array');
  }
  const parsedRecords = records.map(record => ({
    ...JSON.parse(record.entity_json) as Entity,
    providerId: record.provider_id,
    entityRef: record.entity_ref,
    priority: record.priority,
  }));

  const sortedRecords = _.orderBy(parsedRecords, 'priority', 'desc');
  const baseRecord = sortedRecords[0];
  
  const result: Entity = {
    apiVersion: 'backstage.io/v1alpha1',
    kind: baseRecord.kind,
    metadata: { 
      ...(baseRecord.metadata || {}), 
      annotations: {} 
    },
    spec: { ...(baseRecord.spec || {}) }
  };

  // Merge annotations in priority order (highest priority wins)
  const mergedAnnotations = _.reduce(
    sortedRecords,
    (acc, record) => ({ ...acc, ...(record.metadata?.annotations || {}) }),
    {}
  );

  // Initialize collectors for array fields
  const arrayCollectors = initializeArrayCollectors();
  
  // Collect array values from all records
  populateArrayCollectors(sortedRecords, arrayCollectors);
  
  // Merge collected arrays into result
  mergeArraysIntoResult(result, arrayCollectors);

  if (!_.isEmpty(mergedAnnotations)) {
    result.metadata.annotations = mergedAnnotations;
  }

  return result;
}

function initializeArrayCollectors() {
  return new Map(
    Object.entries(ARRAY_PATHS).flatMap(([section, fields]) =>
      fields.map(field => [`${section}.${field}`, new Set<string>()])
    )
  );
}

function populateArrayCollectors(records: Entity[], collectors: Map<string, Set<string>>) {
  records.forEach(record => {
    Object.entries(ARRAY_PATHS).forEach(([section, fields]) => {
      const sectionData = record[section as keyof typeof ARRAY_PATHS];
      if (!sectionData) return;

      fields.forEach(field => {
        const values = sectionData[field];
        if (Array.isArray(values)) {
          const collector = collectors.get(`${section}.${field}`);
          values.forEach(item => {
            if (!!item) collector?.add(JSON.stringify(item));
          });
        }
      });
    });
  });
}

function mergeArraysIntoResult(result: Entity, collectors: Map<string, Set<string>>) {
  collectors.forEach((values, path) => {
    if (values.size === 0) return;
    
    const [section, field] = path.split('.');
    const parsedValues = Array.from(values)
      .map(item => JSON.parse(item))
      .filter(Boolean);
    
    if (parsedValues.length > 0) {
      (result[section as keyof typeof ARRAY_PATHS] as Record<string, any[]>)[field] = parsedValues;
    }
  });
}