import { Knex } from 'knex';
import { LoggerService, DatabaseService } from '@backstage/backend-plugin-api';


export class CatalogRepository {
  private constructor(
    private readonly knex: Knex,
    private readonly logger: LoggerService,
  ) {}

  static async create(db: DatabaseService, logger: LoggerService): Promise<CatalogRepository> {
    const knex = await db.getClient();
    const repo = new CatalogRepository(knex as unknown as Knex, logger);
    return repo;
  }

  async findApplication(id: string) {
    // TODO replace with real query against the catalog tables
    this.logger.debug(`Fetching application ${id} from catalog`);
    return { id, name: `App ${id}`, description: 'Fetched from DAL layer' };
  }
}