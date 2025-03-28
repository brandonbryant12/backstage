
// <ai_context>
// This file defines the TypeScript interface for the configuration expected
// by the 'my-tech-radar' backend plugin in app-config.yaml.
// It specifies the structure for data source (CSV URL), optional scheduling,
// and optional database settings.
// </ai_context>
import { HumanDuration } from '@backstage/types';
import { Knex } from 'knex';

export interface Config {
  /**
   * Configuration for the custom Tech Radar backend plugin
   * @visibility backend
   */
  myTechRadar?: {
    /**
     * Configuration for the data source. Expand this if more sources are added.
     */
    source: {
      /**
       * Configuration for reading data from a CSV file.
       */
      csv: {
        /**
         * The URL from which to fetch the tech radar CSV data.
         * Can be a file path (e.g., 'file:///path/to/data.csv') or HTTP(S) URL.
         * Ensure Backstage backend has access and necessary integrations (e.g., for private GitHub repos).
         */
        url: string;
      };
    };
    /**
     * Optional: Schedule configuration for the data refresh task.
     * Uses HumanDuration format (e.g., { hours: 24 }).
     * @see https://backstage.io/docs/reference/types/duration
     */
    schedule?: {
      /**
       * The frequency of the scheduled task execution.
       * @see https://backstage.io/docs/reference/types/duration
       */
      frequency: HumanDuration;
      /**
       * The timeout duration for the scheduled task.
       * @see https://backstage.io/docs/reference/types/duration
       */
      timeout: HumanDuration;
      /**
       * Optional: The initial delay before the first execution.
       * @see https://backstage.io/docs/reference/types/duration
       */
      initialDelay?: HumanDuration;
    };
     /**
      * Optional: Database configuration specific to the tech-radar plugin.
      * If omitted, the plugin will use the root `backend.database` configuration.
      */
     database?: {
       /**
        * The database client type, e.g. 'pg', 'better-sqlite3'.
        */
       client?: string;
       /**
        * Database connection details. Can be a connection string or an object.
        * Refer to Knex.js documentation for details: https://knexjs.org/guide/#connection
        */
       connection?: Knex.Config['connection'] | string;
     };
  };
}
      