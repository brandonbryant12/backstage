import { Knex } from 'knex';
import { LoggerService, DatabaseService } from '@backstage/backend-plugin-api';


const TABLE_NAME = 'final_entities';

export class CatalogRepository {
  private constructor(
    private readonly knex: Knex,
    private readonly logger: LoggerService,
  ) {}

  static async create(db: DatabaseService, logger: LoggerService): Promise<CatalogRepository> {
    const knex = await db.getClient();
    const repo = new CatalogRepository(knex, logger);
    return repo;
  }

  async findApplication(id: string) {
    const entityRef = `component:default/${id}`.toLowerCase();

    this.logger.debug(`Fetching application with entityRef ${entityRef} from catalog`);

    const row = await this.knex(TABLE_NAME)
      .where({ entity_ref: entityRef })
      .first();

    if (!row) {
      this.logger.warn(`Application with entityRef ${entityRef} not found`);
      return null;
    }

    const application = JSON.parse(row.final_entity)
    return {
      id: application.metadata.name,
      name: application.metadata.name,
      description: application.metadata.description,
      agileEntityName: application.metadata?.annotations?.['project-key']
    };
  }
}