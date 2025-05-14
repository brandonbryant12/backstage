import React, { PropsWithChildren } from 'react';
import { ApolloProvider } from '@apollo/client/react';
import { apolloClient } from './client';

/**
 * GraphQLProvider wraps the React tree with a shared Apollo Client.
 *
 * ```tsx
 * <GraphQLProvider>
 *   <YourApp />
 * </GraphQLProvider>
 * ```
 */
export const GraphQLProvider: React.FC<PropsWithChildren<{}>> = ({ children }) => (
  <ApolloProvider client={apolloClient}>{children}</ApolloProvider>
);