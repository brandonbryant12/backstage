import { DatabaseService, LoggerService } from '@backstage/backend-plugin-api';
import { CatalogRepository } from '../dal/catalogRepository';

export class ApplicationService {
  constructor(
    private readonly db: DatabaseService,
    private readonly logger: LoggerService,
  ) {}

  static async create(db: DatabaseService, logger: LoggerService) {
    return new ApplicationService(db, logger);
  }

  async findById(id: string) {
    const repo = await CatalogRepository.create(this.db, this.logger);
    return repo.findApplication(id);
  }
}