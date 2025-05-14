import { apolloClient } from './client';
import {
  GetApplicationDocument,
  type GetApplicationQueryVariables,
} from './__generated__/graphql';

describe('Apollo Client Supergraph Queries', () => {
  it('should fetch application data from the supergraph', async () => {
    const variables: GetApplicationQueryVariables = { id: 'example-website' };

    const { data, errors } = await apolloClient.query({
      query: GetApplicationDocument,
      variables: variables,
    });

    expect(errors).toBeUndefined();
    expect(data).toBeDefined();
    expect(data?.applicationById).toBeDefined();
    expect(data?.applicationById?.id).toBe('example-website');
    expect(data?.applicationById?.name).toBe('example-website');
  });
});