import { ApolloClient, InMemoryCache, HttpLink } from '@apollo/client/core';

const SUPERGRAPH_URI = 'http://localhost:4000/graphql';

export const apolloClient = new ApolloClient({
  link: new HttpLink({
    uri: SUPERGRAPH_URI,
    fetch,
  }),
  cache: new InMemoryCache(),
});