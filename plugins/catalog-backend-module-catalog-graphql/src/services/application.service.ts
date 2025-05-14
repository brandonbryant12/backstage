import { ApplicationDAO } from '../dal/applicationDAO';

export class ApplicationService {
  constructor(
    private readonly applicationDao: ApplicationDAO,
  ) {}


  async findById(id: string) {
    return this.applicationDao.findApplication(id);
  }
}