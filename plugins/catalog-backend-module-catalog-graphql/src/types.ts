import { LoggerService, BackstageUserInfo } from '@backstage/backend-plugin-api';
import { ApplicationService } from './services/application.service';

export interface GraphQLContext {
  logger: LoggerService;
  backstageUser?: BackstageUserInfo;
  applicationService: ApplicationService;
} 