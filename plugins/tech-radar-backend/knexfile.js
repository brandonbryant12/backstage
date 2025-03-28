
// <ai_context>
// This file is specifically for the Knex CLI to find database connection details
// when running migrations manually (e.g., `yarn workspace ... db:migrate:latest`).
// It loads the Backstage configuration using standard Backstage tooling
// and extracts the database configuration relevant to this plugin.
// It now points to the migrations directory under 'src/migrations'.
// </ai_context>
// This file is used by the Knex CLI to discover database connection settings.
// See https://backstage.io/docs/features/software-catalog/configuration#setting-up-a-standalone-database
// and https://backstage.io/docs/plugins/writing-plugins#database-migrations

// eslint-disable-next-line @backstage/no-undeclared-imports
const { loadConfigSchema } = require('@backstage/config-loader');
// eslint-disable-next-line @backstage/no-undeclared-imports
const { ConfigReader } = require('@backstage/config');
const path = require('path');

// Determine the Backstage root directory, assuming the script is run from the workspace
const backstageRoot = path.resolve(__dirname, '../../../..');

async function main() {
  // Path to the backend package, needed for config schema loading
  const backendPackagePath = path.resolve(backstageRoot, 'packages/backend');

  // Load config schema, potentially including schemas from backend plugins
  const configSchema = await loadConfigSchema({
    dependencies: [], // Add backend plugin dependencies if they contribute config schema
    packagePaths: [backendPackagePath],
  });

  // Define config file paths, mirroring Backstage's default loading behavior
  // Reads from environment variable APP_CONFIG_FILES or defaults to app-config.yaml
  const appConfigs = process.env.APP_CONFIG_FILES?.split(':')
     .map(filePath => ({ path: path.resolve(backstageRoot, filePath) }))
     ?? [ { path: path.resolve(backstageRoot, 'app-config.yaml') }];


  // Read config files and environment variables
  const config = ConfigReader.fromConfigs(appConfigs);

  // Attempt to get plugin-specific database config first
  let databaseConfig = config.getOptionalConfig('myTechRadar.database');

  // Fallback to the root backend database config if plugin-specific one isn't set
  if (!databaseConfig) {
    databaseConfig = config.getOptionalConfig('backend.database');
  }

  // Ensure database configuration exists
  if (!databaseConfig) {
    throw new Error(
      'Database config not found in app-config.yaml or related files. ' +
      'Configure either `backend.database` or `myTechRadar.database`',
    );
  }

  // Construct the Knex configuration object
  const knexConfig = {
    client: databaseConfig.getString('client'),
    connection: databaseConfig.get('connection'), // Can be string or object
    // Point knex to the migrations directory within this plugin's src folder
    migrations: {
      directory: './src/migrations', // Updated path
    },
    // Required for SQLite to treat undefined bindings as NULL
    useNullAsDefault: databaseConfig.getString('client') === 'better-sqlite3',
  };

  // Uncomment for debugging knex config during migration runs
  // console.log('Knex config for migrations:', JSON.stringify(knexConfig, null, 2));

  return knexConfig;
}

// Export the promise directly for Knex CLI
module.exports = main();
      