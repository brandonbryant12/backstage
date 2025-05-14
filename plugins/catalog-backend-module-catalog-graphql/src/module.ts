import {
  coreServices,
  createBackendModule,
} from '@backstage/backend-plugin-api';
import { ApolloServer } from '@apollo/server';
import { expressMiddleware } from '@apollo/server/express4';
import express from 'express';
import cors from 'cors';
import { readFileSync } from 'fs';
import path from 'path';
import { ApplicationService } from './services/application.service';
import { applicationResolvers } from './resolvers/application.resolver';
import { buildSubgraphSchema } from '@apollo/subgraph'
import gql from 'graphql-tag';
import { GraphQLContext } from './types';
import { ApplicationDAO } from './dal/applicationDAO';

export const catalogModuleCatalogApiExtension = createBackendModule({
  pluginId: 'catalog',
  moduleId: 'catalog-graphql',
  register(reg) {
    reg.registerInit({
      deps: {
        logger: coreServices.logger,
        database: coreServices.database,
        httpRouter: coreServices.httpRouter,
        httpAuth: coreServices.httpAuth,
        userInfo: coreServices.userInfo,
      },
      async init({ logger, database, httpRouter, httpAuth, userInfo }) {
        const typeDefs = readFileSync(
          path.resolve(
            '../../plugins/catalog-backend-module-catalog-graphql/schema.graphql',
          ),
          'utf8',
        );

        const server = new ApolloServer<GraphQLContext>({
          schema: buildSubgraphSchema({ typeDefs: gql(typeDefs),
            resolvers: applicationResolvers as any,})
        }); 
        await server.start();

        httpRouter.addAuthPolicy({
          path: '/graphql',
          allow: 'unauthenticated',
        });

        const graphqlRouter = express.Router();
        graphqlRouter.use(express.json());
        graphqlRouter.use(
          '/',
          expressMiddleware(server, {
            context: async ({ req }) => {
              let backstageUser;
              try {
                const creds = await httpAuth.credentials(req, {
                  allow: ['user'],
                });
                backstageUser = await userInfo.getUserInfo(creds);
              } catch {
                backstageUser = undefined;
              }
              return {
                logger,
                backstageUser,
                applicationService: new ApplicationService(
                  await ApplicationDAO.create(database, logger),
                ),
              } as GraphQLContext;
            },
          }),
        );

        const root = express.Router();
        root.use(
          cors({
            origin: [
              'http://localhost:3000',
              'https://studio.apollographql.com',
            ],
            credentials: false,
            methods: ['POST', 'OPTIONS'],
            allowedHeaders: ['Content-Type', 'Authorization'],
          }),
        );
        root.options('/graphql', (_req, res) => res.sendStatus(204));
        root.use('/graphql', graphqlRouter);

        httpRouter.use(root);
        logger.info(
          'Catalog GraphQL subgraph endpoint ready at /api/catalog/graphql',
        );
      },
    });
  },
});