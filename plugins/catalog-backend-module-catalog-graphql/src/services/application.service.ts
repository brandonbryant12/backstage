import { Injectable, Inject } from '@nestjs/common';
import { DatabaseService, LoggerService } from '@backstage/backend-plugin-api';
import { CatalogRepository } from '../dal/catalogRepository';

@Injectable()
export class ApplicationService {
  constructor(
    @Inject('DATABASE_SERVICE') private readonly db: DatabaseService,
    @Inject('LOGGER_SERVICE') private readonly logger: LoggerService,
  ) {}

  async findById(id: string) {
    const repo = await CatalogRepository.create(this.db, this.logger);
    return repo.findApplication(id);
  }
}