// plugins/catalog-backend-module-catalog-graphql/src/app.module.ts
import 'reflect-metadata';
import { DynamicModule, Module } from '@nestjs/common'; // Import DynamicModule
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { join } from 'path';

import { ApplicationResolver } from './resolvers/application.resolver';
import { ApplicationService } from './services/application.service';
// Import the types for DatabaseService and LoggerService if you haven't already
import { DatabaseService, LoggerService } from '@backstage/backend-plugin-api';

@Module({}) // Keep a base @Module() decorator if you have global aspects not tied to forRoot
export class GraphqlCatalogModule {
  static forRoot(database: DatabaseService, logger: LoggerService): DynamicModule {
    return {
      module: GraphqlCatalogModule,
      imports: [
        GraphQLModule.forRoot<ApolloDriverConfig>({
          driver: ApolloDriver,
          typePaths: [join(__dirname, '../../schema.graphql')], // Ensure this path is correct
          playground: true,
          definitions: {
            // Consider adjusting this path if 'src/graphql.ts' is relative to project root
            path: join(process.cwd(), 'plugins/catalog-backend-module-catalog-graphql/src/graphql.ts'),
            outputAs: 'class',
          },
        }),
      ],
      providers: [
        ApplicationResolver,
        ApplicationService,
        { provide: 'DATABASE_SERVICE', useValue: database },
        { provide: 'LOGGER_SERVICE', useValue: logger },
      ],
    };
  }
}