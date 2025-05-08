// plugins/catalog-backend-module-catalog-graphql/src/module.ts
import {
  coreServices,
  createBackendModule,
} from '@backstage/backend-plugin-api';
import { NestFactory } from '@nestjs/core';
import { ExpressAdapter } from '@nestjs/platform-express';
import { GraphqlCatalogModule } from './app.module'; // Ensure this path is correct

export const catalogModuleCatalogApiExtension = createBackendModule({
  pluginId: 'catalog',
  moduleId: 'catalog-graphql',
  register(reg) {
    reg.registerInit({
      deps: {
        logger: coreServices.logger,
        database: coreServices.database,
        httpRouter: coreServices.httpRouter,
      },
      async init({ logger, httpRouter, database }) {
        const nestApp = await NestFactory.create(
          GraphqlCatalogModule.forRoot(database, logger), // Use the dynamic module here
          new ExpressAdapter(httpRouter), // Pass the express instance from httpRouter
          {
            logger: false, // This is a valid NestApplicationOption
            // Remove extraProviders from here
          },
        );
        await nestApp.init();
        logger.info('Catalog GraphQL module started');
      },
    });
  },
});