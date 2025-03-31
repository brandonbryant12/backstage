import { AbstractTechRadarDataService, AbstractTechRadarDataServiceOptions } from './AbstractTechRadarDataService';
import { TechRadarEntry } from '../repository/entriesRepository';
import { parse } from 'csv-parse/sync';
import fs from 'fs';

class TechRadarCSVDataService extends AbstractTechRadarDataService {
  private csvFilePath: string;

  constructor(csvFilePath: string, options: AbstractTechRadarDataServiceOptions) {
    super(options);
    this.csvFilePath = csvFilePath;
  }

  async read(): Promise<TechRadarEntry[]> {
    const fileContent = fs.readFileSync(this.csvFilePath, 'utf-8');
    const records = parse(fileContent, {
      columns: true,
      skip_empty_lines: true
    });

    return records.map((record: any) => ({
      entry_id: record.entry_id,
      title: record.title,
      quadrant_name: record.quadrant_name,
      disposition_name: record.disposition_name,
      description: record.description,
      date: record.date ? new Date(record.date) : undefined,
      url: record.url
    }));
  }
}

export { TechRadarCSVDataService }; 