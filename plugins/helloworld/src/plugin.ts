
/* <ai_context>
Helloworld plugin main file. Removed IntegrationsPage route, replaced each card's createRoutableExtension with createComponentExtension for lazy loading, removed usage of routeRefs for them.
</ai_context> */

import {
  createPlugin,
  createComponentExtension,
} from '@backstage/core-plugin-api';

// Import individual card components lazy
export const helloworldPlugin = createPlugin({
  id: 'helloworld',
});


export const EntityConsumedApisCardExtension = helloworldPlugin.provide(
  createComponentExtension({
    name: 'EntityConsumedApisCard',
    component: {
      lazy: () =>
        import('./components/apiCards/EntityConsumedApisCard').then(
          m => m.EntityConsumedApisCard,
        ),
    },
  }),
);

export const EntityProvidedApisCardExtension = helloworldPlugin.provide(
  createComponentExtension({
    name: 'EntityProvidedApisCard',
    component: {
      lazy: () =>
        import('./components/apiCards/EntityProvidedApisCard').then(
          m => m.EntityProvidedApisCard,
        ),
    },
  }),
);

export const EntityDependsOnComponentsCardExtension = helloworldPlugin.provide(
  createComponentExtension({
    name: 'EntityDependsOnComponentsCard',
    component: {
      lazy: () =>
        import('./components/catalogCards/EntityDependsOnComponentsCard').then(
          m => m.EntityDependsOnComponentsCard,
        ),
    },
  }),
);

export const EntityDependsOnResourcesCardExtension = helloworldPlugin.provide(
  createComponentExtension({
    name: 'EntityDependsOnResourcesCard',
    component: {
      lazy: () =>
        import('./components/catalogCards/EntityDependsOnResourcesCard').then(
          m => m.EntityDependsOnResourcesCard,
        ),
    },
  }),
);

export const EntityHasSubcomponentsCardExtension = helloworldPlugin.provide(
  createComponentExtension({
    name: 'EntityHasSubcomponentsCard',
    component: {
      lazy: () =>
        import('./components/catalogCards/EntityHasSubcomponentsCard').then(
          m => m.EntityHasSubcomponentsCard,
        ),
    },
  }),
);
