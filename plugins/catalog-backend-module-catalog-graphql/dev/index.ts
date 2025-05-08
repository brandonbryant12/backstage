import { createBackend } from '@backstage/backend-defaults';
import { mockServices } from '@backstage/backend-test-utils';
import { catalogServiceMock } from '@backstage/plugin-catalog-node/testUtils';

// Minimal backend for local development of the catalog-graphql module
const backend = createBackend();

// Allow unauthenticated local requests
backend.add(mockServices.auth.factory());
backend.add(mockServices.httpAuth.factory());

// Provide a mock catalog so queries can resolve something useful
backend.add(
  catalogServiceMock.factory({
    entities: [
      {
        apiVersion: 'backstage.io/v1alpha1',
        kind: 'Component',
        metadata: { name: 'sample', title: 'Sample Component' },
        spec: { type: 'service' },
      },
    ],
  }),
);

// Mount the actual GraphQL module
backend.add(import('../src'));

backend.start();