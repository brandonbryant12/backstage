
// <ai_context>
// This file sets up a development environment for the tech radar backend plugin.
// It uses @backstage/backend-defaults and mock services (logger, database, config, etc.)
// to create a minimal backend instance. It includes necessary configuration for the plugin
// to run, pointing to a local example CSV file structured for the simplified 'latest state' format.
// It also registers the plugin itself.
// </ai_context>
import { createBackend } from '@backstage/backend-defaults';
import { mockServices } from '@backstage/backend-test-utils';
// import { catalogServiceMock } from '@backstage/plugin-catalog-node/testUtils'; // Keep if using catalog interaction
import { TaskScheduler } from '@backstage/backend-tasks';
import { ConfigReader } from '@backstage/config';
import path from 'path';

// This is the development setup for your plugin that wires up a
// minimal backend that can use both real and mocked plugins and services.
//
// Start up the backend by running `yarn start` in the package directory.

const backend = createBackend();

// --- Mock Core Services ---
// Using mocks allows local development without needing full infra setup.
backend.add(mockServices.logger.factory());
// Use an in-memory SQLite database for development
backend.add(mockServices.database.factory());

// Configuration for development
const devConfig = new ConfigReader({
  myTechRadar: {
    source: {
      csv: {
        // Point to a local or accessible test CSV file for development
        // Ensure this CSV matches the structure expected by CsvTechRadarDataService
        url: `file://${path.resolve(__dirname, './example-radar.csv')}`, // Use path.resolve for reliability
      }
    },
    // Optional: configure schedule for dev if needed
    schedule: { frequency: { minutes: 1 }, timeout: { seconds: 30 }, initialDelay: { seconds: 5 } },
    // Provide explicit DB config for the plugin if needed, otherwise relies on backend.database
    // database: { client: 'better-sqlite3', connection: ':memory:' }
  },
  // Required by backend-tasks scheduler wrapper and potentially database service
  backend: {
    database: {
      client: 'better-sqlite3',
      connection: ':memory:',
    },
    tasks: {
       scheduler: { // Configuration for the TaskScheduler (New Backend System)
         enabled: true,
         // dangerouslyEnableLegacyScheduler might not be needed if using scheduler.forPlugin
       },
     },
  },
});
backend.add(mockServices.config.factory({ data: devConfig.get() }));

backend.add(mockServices.urlReader.factory());

// Using the real scheduler service from core services, driven by config
// Note: For the new backend system, scheduler integration is often handled within the plugin's init.
// This setup might be more relevant if directly using TaskScheduler outside the plugin module.
// If the plugin uses coreServices.scheduler, this manual setup might be redundant or conflict.
// Let's assume the plugin uses coreServices.scheduler and remove the explicit TaskScheduler setup here.
// const scheduler = TaskScheduler.fromConfig(devConfig.getConfig('backend.tasks'));
// backend.add(scheduler.createScheduledTaskRunner);
backend.add(mockServices.scheduler.factory()); // Provide the core scheduler service

// Mock auth if not testing auth features
// backend.add(mockServices.auth.factory());
// backend.add(mockServices.httpAuth.factory());

// Mock catalog if your plugin interacts with it (remove if not needed)
/*
backend.add(
  catalogServiceMock.factory({
    entities: [
      {
        apiVersion: 'backstage.io/v1alpha1',
        kind: 'Component',
        metadata: {
          name: 'sample',
          title: 'Sample Component',
        },
        spec: {
          type: 'service',
        },
      },
    ],
  }),
);
*/


// --- Add Your Plugin ---
// The plugin will be initialized using the services provided above (mocks and real ones)
backend.add(import('../src'));

// --- Start Backend ---
backend.start();


// --- Example CSV (./dev/example-radar.csv) ---
/* Create this file in the dev directory with the expected 'latest state' format

key,id,title,quadrant,ring,description,date,moved,timeline_description,link_title_1,link_url_1,link_title_2,link_url_2
react,react-id,React,solutions,approved,"A JavaScript library for building user interfaces.",2023-10-26,0,"Approved for general use.","React Docs","https://react.dev/","Community","https://react.dev/community"
vue,vue-id,Vue.js,solutions,emerging,"The Progressive JavaScript Framework.",2024-01-15,1,"Emerging as a strong alternative.","Homepage","https://vuejs.org/"
backstage,backstage-id,Backstage,patterns,approved,"Platform for building developer portals.",2023-05-01,0,"Our standard platform.","Backstage.io","https://backstage.io"
microfrontends,mf-id,Microfrontends,patterns,submitted,"Architectural style for frontend.",2024-03-01,-1,"Submitted for review, use with caution.","Martin Fowler","https://martinfowler.com/articles/micro-frontends.html"
typescript,ts-id,TypeScript,guidelines,approved,"Typed JavaScript at scale.",2022-01-01,0,"Standard for new projects."
eslint,eslint-id,ESLint,guidelines,approved,"Pluggable JavaScript linter.",2022-06-10,0,"Use the shared config."
agile,agile-id,Agile Methodologies,standards,approved,"Standard way of working.",2020-01-01,0,"Follow team practices."
gitflow,gitflow-id,Gitflow,standards,restricted,"Complex branching model.",2023-11-01,-1,"Restricted: Prefer simpler trunk-based development.","Atlassian Gitflow","https://www.atlassian.com/git/tutorials/comparing-workflows/gitflow-workflow"

*/
      