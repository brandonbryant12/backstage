
// <ai_context>
// This file contains unit tests for the CsvTechRadarDataService class.
// It utilizes Jest mocks for dependencies like RootConfigService, UrlReaderService,
// and LoggerService to isolate the service's logic. Tests cover scenarios including
// successful CSV fetching and parsing, transformation of records into SourceEntry format,
// handling of various data formats (dates, links, moved state), validation of required fields,
// and graceful handling of errors like invalid dates or missing columns.
// </ai_context>

import { UrlReaderService, RootConfigService } from '@backstage/backend-plugin-api';
import { getVoidLogger } from '@backstage/backend-common';
import { CsvTechRadarDataService } from './CsvTechRadarDataService';
import { InputError } from '@backstage/errors';
import { MovedState } from '@backstage-community/plugin-tech-radar-common';
import { Readable } from 'stream';

// Mocks
const mockConfig = {
  getString: jest.fn(),
} as unknown as jest.Mocked<RootConfigService>;

const mockReader = {
  readUrl: jest.fn(),
} as unknown as jest.Mocked<UrlReaderService>;

const logger = getVoidLogger();

// Helper to create a mock UrlReader response
const createMockReadResponse = (content: string | Buffer) => ({
  buffer: jest.fn().mockResolvedValue(Buffer.from(content)),
  stream: jest.fn().mockReturnValue(Readable.from(content)),
});

describe('CsvTechRadarDataService', () => {
  let service: CsvTechRadarDataService;

  beforeEach(() => {
    jest.resetAllMocks();
    // Default mock setup
    mockConfig.getString.mockReturnValue('mock://test.csv');
    service = new CsvTechRadarDataService(mockConfig, logger, mockReader);
  });

  it('should throw InputError if config URL is missing', () => {
    mockConfig.getString.mockImplementation(() => { throw new Error('Missing config value')});
    expect(() => new CsvTechRadarDataService(mockConfig, logger, mockReader))
      .toThrow(InputError);
     // Also test returning undefined/null if getString could do that
     mockConfig.getString.mockReturnValue(undefined as any);
      expect(() => new CsvTechRadarDataService(mockConfig, logger, mockReader))
         .toThrow(InputError); // Assuming constructor checks truthiness
  });

  it('should throw error if reading URL fails', async () => {
    const readError = new Error('Network Error');
    mockReader.readUrl.mockRejectedValue(readError);

    await expect(service.read()).rejects.toThrow(
      `Failed to read CSV from mock://test.csv: ${readError.message}`,
    );
  });

  it('should parse valid CSV data correctly', async () => {
    const csvContent = `key,id,title,quadrant,ring,description,date,moved,timeline_description,link_title_1,link_url_1
entry1,id1,Title 1,solutions,approved,Desc 1,2024-01-10,0,Timeline Desc 1,Link 1,http://l1.com
entry2,,Title 2,patterns,emerging,,2024-02-20,1,,,,`; // Entry 2 has minimal fields + ID defaults to key
    mockReader.readUrl.mockResolvedValue(createMockReadResponse(csvContent));

    const result = await service.read();

    expect(result).toHaveLength(2);
    expect(result[0]).toEqual({
      key: 'entry1',
      id: 'id1',
      title: 'Title 1',
      quadrant: 'solutions',
      description: 'Desc 1',
      timeline: [
        {
          date: new Date('2024-01-10'),
          ringId: 'approved',
          description: 'Timeline Desc 1',
          moved: MovedState.NoChange,
        },
      ],
      links: [{ title: 'Link 1', url: 'http://l1.com' }],
    });
    expect(result[1]).toEqual({
       key: 'entry2',
       id: 'entry2', // Defaulted to key
       title: 'Title 2',
       quadrant: 'patterns',
       description: '', // Empty description treated as undefined essentially
       timeline: [
         {
           date: new Date('2024-02-20'),
           ringId: 'emerging',
           description: undefined, // Empty timeline desc
           moved: MovedState.MovedIn,
         },
       ],
       links: undefined, // No links
     });
  });

  it('should skip records with missing required fields', async () => {
    const csvContent = `key,id,title,quadrant,ring,date
valid,id1,Title 1,solutions,approved,2024-01-01
missing_key,,Title 2,patterns,emerging,2024-01-02
missing_title,id3,,guidelines,submitted,2024-01-03
missing_quadrant,id4,Title 4,,restricted,2024-01-04
missing_ring,id5,Title 5,solutions,,2024-01-05
missing_date,id6,Title 6,standards,approved,`;
    mockReader.readUrl.mockResolvedValue(createMockReadResponse(csvContent));
    // Optional: Spy on logger.warn if needed

    const result = await service.read();

    expect(result).toHaveLength(1); // Only the first record is valid
    expect(result[0].key).toBe('valid');
    // Optionally check logger.warn calls if logger is not void logger
  });

  it('should skip records with invalid dates', async () => {
    const csvContent = `key,title,quadrant,ring,date
valid,Title 1,solutions,approved,2024-01-10
invalid,Title 2,patterns,emerging,not-a-date
valid2,Title 3,solutions,approved,2024/03/15`; // Valid alternative format
    mockReader.readUrl.mockResolvedValue(createMockReadResponse(csvContent));

    const result = await service.read();

    expect(result).toHaveLength(2);
    expect(result[0].key).toBe('valid');
    expect(result[1].key).toBe('valid2');
    expect(result[1].timeline[0].date).toEqual(new Date('2024-03-15')); // Check parsing
  });

  it('should handle different moved values correctly, defaulting invalid to NoChange', async () => {
    const csvContent = `key,title,quadrant,ring,date,moved
nochange,T1,q1,r1,2024-01-01,0
movedin,T2,q2,r2,2024-01-02,1
movedout,T3,q3,r3,2024-01-03,-1
invalid,T4,q4,r4,2024-01-04,5
empty,T5,q5,r5,2024-01-05,
missing,T6,q6,r6,2024-01-06`;
    mockReader.readUrl.mockResolvedValue(createMockReadResponse(csvContent));

    const result = await service.read();

    expect(result).toHaveLength(6);
    expect(result.find(r => r.key === 'nochange')?.timeline[0].moved).toBe(MovedState.NoChange);
    expect(result.find(r => r.key === 'movedin')?.timeline[0].moved).toBe(MovedState.MovedIn);
    expect(result.find(r => r.key === 'movedout')?.timeline[0].moved).toBe(MovedState.MovedOut);
    expect(result.find(r => r.key === 'invalid')?.timeline[0].moved).toBe(MovedState.NoChange); // Defaulted
    expect(result.find(r => r.key === 'empty')?.timeline[0].moved).toBe(MovedState.NoChange); // Defaulted
    expect(result.find(r => r.key === 'missing')?.timeline[0].moved).toBe(MovedState.NoChange); // Defaulted
  });

  it('should handle multiple links correctly', async () => {
    const csvContent = `key,title,quadrant,ring,date,link_title_1,link_url_1,link_title_2,link_url_2
links,T1,q1,r1,2024-01-01,Link 1, http://l1.com , Link 2 ,http://l2.com
onelink,T2,q2,r2,2024-01-02,Link A,http://la.com,,
nolinks,T3,q3,r3,2024-01-03,,,,,`;
     mockReader.readUrl.mockResolvedValue(createMockReadResponse(csvContent));

     const result = await service.read();

     expect(result.find(r => r.key === 'links')?.links).toEqual([
       { title: 'Link 1', url: 'http://l1.com' },
       { title: 'Link 2', url: 'http://l2.com' },
     ]);
      expect(result.find(r => r.key === 'onelink')?.links).toEqual([
        { title: 'Link A', url: 'http://la.com' },
      ]);
      expect(result.find(r => r.key === 'nolinks')?.links).toBeUndefined();
  });

   it('should handle deprecated url column as a link', async () => {
     // Include 'url' column, but make link_title_1/link_url_1 primary if present
     const csvContent = `key,title,quadrant,ring,date,url,link_title_1,link_url_1
     entry_url,T_URL,q_url,r_url,2024-03-01,http://deprecated.com,,
     entry_both,T_BOTH,q_both,r_both,2024-03-02,http://deprecated.com,Primary Link,http://primary.com`;
     mockReader.readUrl.mockResolvedValue(createMockReadResponse(csvContent));

     const result = await service.read();

     expect(result.find(r => r.key === 'entry_url')?.links).toEqual([
       { title: 'Learn More', url: 'http://deprecated.com' }, // Url added as link
     ]);
      expect(result.find(r => r.key === 'entry_both')?.links).toEqual([
        { title: 'Learn More', url: 'http://deprecated.com' }, // Url added
        { title: 'Primary Link', url: 'http://primary.com' }, // Link 1 added
      ]); // Order might depend on implementation, check both are present
       expect(result.find(r => r.key === 'entry_both')?.links).toHaveLength(2);
   });


  it('should handle CSV with different header case and order', async () => {
    const csvContent = `DATE,QUADRANT,RING,TITLE,KEY,MOVED
2024-01-10,solutions,approved,Title 1,entry1,0`; // Minimal required, different case/order
     mockReader.readUrl.mockResolvedValue(createMockReadResponse(csvContent));

     const result = await service.read();

     expect(result).toHaveLength(1);
     expect(result[0]).toEqual(expect.objectContaining({
       key: 'entry1',
       title: 'Title 1',
       quadrant: 'solutions',
       timeline: [expect.objectContaining({ date: new Date('2024-01-10'), ringId: 'approved', moved: MovedState.NoChange })],
     }));
  });

   it('should handle empty CSV file', async () => {
     const csvContent = ``; // Empty
     mockReader.readUrl.mockResolvedValue(createMockReadResponse(csvContent));
     const result = await service.read();
     expect(result).toEqual([]);

     const csvContentHeaderOnly = `key,id,title,quadrant,ring,description,date,moved`; // Header only
     mockReader.readUrl.mockResolvedValue(createMockReadResponse(csvContentHeaderOnly));
      const resultHeader = await service.read();
      expect(resultHeader).toEqual([]);
   });

    it('should warn if header is present but missing required columns', async () => {
      const csvContent = `key,title,date\nval1,val2,2024-01-01`; // Missing quadrant, ring
      const loggerSpy = jest.spyOn(logger, 'warn');
      mockReader.readUrl.mockResolvedValue(createMockReadResponse(csvContent));

      const result = await service.read();

      expect(result).toHaveLength(0); // Record will be skipped due to missing fields
      expect(loggerSpy).toHaveBeenCalledWith(
          expect.stringContaining('CSV header is missing required columns: quadrant, ring'),
          expect.any(Object)
      );
       expect(loggerSpy).toHaveBeenCalledWith(
           expect.stringContaining('Skipping CSV record 1 due to missing required fields'),
       );
    });
});
      