import { createRouteRef } from '@backstage/core-plugin-api';
import { createSubRouteRef } from '@backstage/core-plugin-api';
import { entityRouteRef } from '@backstage/plugin-catalog-react';

export const rootRouteRef = createRouteRef({
  id: 'tech-radar',
});

export const entityTechRadarDeepDiveRouteRef = createSubRouteRef({
  id: 'entity-tech-radar-deep-dive',
  parent: entityRouteRef,
  path: '/tech-radar',
});