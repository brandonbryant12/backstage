
import { createRouteRef } from '@backstage/core-plugin-api';

export const rootRouteRef = createRouteRef({
  id: 'helloworld',
});

export const catalogCardsRouteRef = createRouteRef({
  id: 'helloworld:catalog-cards',
});

export const apiCardsRouteRef = createRouteRef({
  id: 'helloworld:api-cards',
});

export const integrationsRouteRef = createRouteRef({
  id: 'helloworld:integrations',
});
      