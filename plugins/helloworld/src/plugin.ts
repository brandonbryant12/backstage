
import {
  createPlugin,
  createRoutableExtension,
} from '@backstage/core-plugin-api';
import { rootRouteRef, catalogCardsRouteRef, apiCardsRouteRef, integrationsRouteRef } from './routes';

// Import individual card components
import { EntityConsumedApisCard } from './components/apiCards/EntityConsumedApisCard';
import { EntityProvidedApisCard } from './components/apiCards/EntityProvidedApisCard';
import { EntityDependsOnComponentsCard } from './components/catalogCards/EntityDependsOnComponentsCard';
import { EntityDependsOnResourcesCard } from './components/catalogCards/EntityDependsOnResourcesCard';
import { EntityHasSubcomponentsCard } from './components/catalogCards/EntityHasSubcomponentsCard';

export const helloworldPlugin = createPlugin({
  id: 'helloworld',
  routes: {
    root: rootRouteRef,
    catalogCards: catalogCardsRouteRef,
    apiCards: apiCardsRouteRef,
    integrations: integrationsRouteRef,
  },
});

export const HelloworldPage = helloworldPlugin.provide(
  createRoutableExtension({
    name: 'HelloworldPage',
    component: () =>
      import('./components/ExampleComponent').then(m => m.ExampleComponent),
    mountPoint: rootRouteRef,
  }),
);

// Export IntegrationsPage with lazy loading
export const IntegrationsPage = helloworldPlugin.provide(
  createRoutableExtension({
    name: 'IntegrationsPage',
    component: () =>
      import('./components/IntegrationsPage').then(m => m.IntegrationsPage),
    mountPoint: integrationsRouteRef,
  }),
);

// Export individual API cards
export const EntityConsumedApisCardExtension = helloworldPlugin.provide(
  createRoutableExtension({
    name: 'EntityConsumedApisCard',
    component: () => Promise.resolve(EntityConsumedApisCard),
    mountPoint: apiCardsRouteRef,
  }),
);

export const EntityProvidedApisCardExtension = helloworldPlugin.provide(
  createRoutableExtension({
    name: 'EntityProvidedApisCard',
    component: () => Promise.resolve(EntityProvidedApisCard),
    mountPoint: apiCardsRouteRef,
  }),
);

// Export individual catalog cards
export const EntityDependsOnComponentsCardExtension = helloworldPlugin.provide(
  createRoutableExtension({
    name: 'EntityDependsOnComponentsCard',
    component: () => Promise.resolve(EntityDependsOnComponentsCard),
    mountPoint: catalogCardsRouteRef,
  }),
);

export const EntityDependsOnResourcesCardExtension = helloworldPlugin.provide(
  createRoutableExtension({
    name: 'EntityDependsOnResourcesCard',
    component: () => Promise.resolve(EntityDependsOnResourcesCard),
    mountPoint: catalogCardsRouteRef,
  }),
);

export const EntityHasSubcomponentsCardExtension = helloworldPlugin.provide(
  createRoutableExtension({
    name: 'EntityHasSubcomponentsCard',
    component: () => Promise.resolve(EntityHasSubcomponentsCard),
    mountPoint: catalogCardsRouteRef,
  }),
);
      