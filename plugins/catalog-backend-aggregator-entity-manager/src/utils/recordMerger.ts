import { EntityRecord } from '../types';
import _ from 'lodash';

const ARRAY_PATHS = {
  metadata: ['tags', 'links'],
  spec: [
    'implementsApis',
    'consumesApis',
    'providesApis',
    'dependsOn',
    'systems',
    'owner'
  ]
} as const;

export function mergeRecords(records: EntityRecord[]): EntityRecord {
  if (_.isEmpty(records)) {
    throw new Error('Cannot merge empty records array');
  }

  const baseRecord = records.reduce((highest, current) => 
    current.priorityScore > highest.priorityScore ? current : highest
  );

  const result: EntityRecord = {
    ...baseRecord,
    metadata: {
      ...(baseRecord.metadata || {}),
      annotations: {}
    },
    spec: {
      ...(baseRecord.spec || {})
    }
  };

  const collectors = new Map<string, Set<string>>();
  
  for (const section of ['metadata', 'spec'] as const) {
    for (const field of ARRAY_PATHS[section]) {
      collectors.set(`${section}.${field}`, new Set<string>());
    }
  }

  const annotations = new Map<string, string>();
  
  for (const record of records) {
    if (record.metadata?.annotations) {
      for (const [key, value] of Object.entries(record.metadata.annotations)) {
        if (!annotations.has(key)) {
          annotations.set(key, value);
        }
      }
    }
  }

  for (const record of records) {
    if (record.metadata) {
      for (const field of ARRAY_PATHS.metadata) {
        const values = record.metadata[field];
        if (Array.isArray(values)) {
          const collector = collectors.get(`metadata.${field}`);
          values.forEach(item => {
            if (item !== null && item !== undefined) {
              collector?.add(JSON.stringify(item));
            }
          });
        }
      }
    }

    if (record.spec) {
      for (const field of ARRAY_PATHS.spec) {
        const values = record.spec[field];
        if (Array.isArray(values)) {
          const collector = collectors.get(`spec.${field}`);
          values.forEach(item => {
            if (item !== null && item !== undefined) {
              collector?.add(JSON.stringify(item));
            }
          });
        }
      }
    }
  }

  for (const [path, values] of collectors) {
    if (values.size === 0) continue;

    const [section, field] = path.split('.');
    if (section === 'metadata' || section === 'spec') {
      const parsedValues = Array.from(values)
        .map(item => JSON.parse(item))
        .filter(item => item !== null && item !== undefined);
        
      if (parsedValues.length > 0) {
        (result[section] as Record<string, any[]>)[field] = parsedValues;
      }
    }
  }

  if (annotations.size > 0) {
    result.metadata.annotations = Object.fromEntries(annotations);
  }

  return result;
}