import { EntityRecord } from '../types';

/**
 * Merges multiple entity records into a single record, prioritizing data from records
 * with higher priority scores while preserving annotations from all sources.
 * 
 * @param records - Array of entity records to merge
 * @returns A single merged entity record
 */
export function mergeRecords(records: EntityRecord[]): EntityRecord {
  const sortedRecords = [...records].sort((a, b) => b.priorityScore - a.priorityScore);
  const highestPriorityRecord = sortedRecords[0];

  const mergedRecord: EntityRecord = {
    ...highestPriorityRecord,
    metadata: {
      ...highestPriorityRecord.metadata,
      annotations: {},
    },
  };

  const allKeys = new Set(
    sortedRecords.flatMap(r => Object.keys(r.metadata.annotations || {}))
  );

  for (const key of allKeys) {
    for (const record of sortedRecords) {
      const annotations = record.metadata.annotations || {};
      if (key in annotations) {
        mergedRecord.metadata.annotations![key] = annotations[key];
        break;
      }
    }
  }

  return mergedRecord;
} 