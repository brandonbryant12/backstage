import {
  coreServices,
  createBackendModule,
} from '@backstage/backend-plugin-api';
import { ExampleFragmentProvider } from './provider/ExampleFragmentProvider';
import { entityAggregatorService } from '@core/plugin-catalog-backend-module-aggregator-entity-manager';

export const catalogModuleExampleFragmentProvider = createBackendModule({
  pluginId: 'catalog',
  moduleId: 'example-fragment-provider',
  register(reg) {
    reg.registerInit({
      deps: {
        logger: coreServices.logger,
        scheduler: coreServices.scheduler,
        entityAggregatorService: entityAggregatorService,
      },
      async init({ logger, scheduler, entityAggregatorService }) {
        const provider = new ExampleFragmentProvider(
          entityAggregatorService,
          logger,
          scheduler,
        );
        await provider.start();
      },
    });
  },
});
