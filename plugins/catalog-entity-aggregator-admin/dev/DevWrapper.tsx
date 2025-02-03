import React from 'react';
import { EntityProvider } from '@backstage/plugin-catalog-react';
import { TestApiProvider } from '@backstage/test-utils';
import { configApiRef } from '@backstage/core-plugin-api';

interface DevWrapperProps {
  children: React.ReactNode;
  namespace: string;
}

export const DevWrapper = ({ children, namespace }: DevWrapperProps) => {
  const mockEntity = {
    apiVersion: 'backstage.io/v1alpha1',
    kind: 'Component',
    metadata: {
      name: 'test-component',
      namespace: namespace,
    },
    spec: {
      type: 'service',
      lifecycle: 'production',
    },
  };

  const mockConfig = {
    getBoolean: (key: string) => {
      if (key === 'entityAggregator.provider.enabled') {
        return true;
      }
      return false;
    },
  };

  return (
    <TestApiProvider apis={[[configApiRef, mockConfig]]}>
      <EntityProvider entity={mockEntity}>
        {children}
      </EntityProvider>
    </TestApiProvider>
  );
};