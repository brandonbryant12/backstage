/*
 * Hi!
 *
 * Note that this is an EXAMPLE Backstage backend. Please check the README.
 *
 * Happy hacking!
 */

import 'reflect-metadata';

import { createBackend } from '@backstage/backend-defaults';

const backend = createBackend();

backend.add(import("@core/plugin-catalog-backend-module-aggregator-entity-manager"));
backend.add(import('@core/plugin-catalog-backend-module-aggregator-entity-provider'));
backend.add(import('@backstage/plugin-app-backend'));
backend.add(import('@backstage/plugin-proxy-backend'));
backend.add(import('@backstage/plugin-scaffolder-backend'));
backend.add(import('@backstage/plugin-techdocs-backend'));
backend.add(import('@backstage/plugin-auth-backend'));
backend.add(import('@backstage/plugin-auth-backend-module-guest-provider'));
backend.add(import('@backstage/plugin-catalog-backend'));
backend.add(import('@backstage/plugin-catalog-backend-module-scaffolder-entity-model'));
backend.add(import('@backstage/plugin-catalog-backend-module-logs'));
backend.add(import('@backstage/plugin-permission-backend'));
backend.add(import('@backstage/plugin-permission-backend-module-allow-all-policy'));
backend.add(import('@backstage/plugin-search-backend'));
backend.add(import('@backstage/plugin-search-backend-module-pg'));
backend.add(import('@backstage/plugin-search-backend-module-catalog'));
backend.add(import('@backstage/plugin-search-backend-module-techdocs'));

backend.add(import('backstage-plugin-catalog-backend-module-example-fragment-provider'));
backend.add(import('@internal/backstage-plugin-catalog-backend-module-template-processor'));
backend.add(import('@internal/plugin-tech-radar-backend'));
backend.add(import('@internal/plugin-catalog-backend-module-catalog-graphql'));
backend.start();