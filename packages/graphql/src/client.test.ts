import { gql } from '@apollo/client/core';
import { apolloClient } from './client';

describe('Apollo Client Supergraph Queries', () => {
  it('should fetch application data from the supergraph', async () => {
    const GET_APPLICATION_QUERY = gql`
      query GetApplication($id: ID!) {
        applicationById(id: $id) {
          id
          name
          description
        }
      }
    `;

    try {
      const { data, errors } = await apolloClient.query({
        query: GET_APPLICATION_QUERY,
        variables: { id: 'sample' },
      });

      expect(errors).toBeUndefined();
      expect(data).toBeDefined();
      expect(data.applicationById).toBeDefined();
      expect(data.applicationById.id).toBe('sample');
      expect(data.applicationById.name).toBe('sample');
    } catch (error) {
      console.error('Test failed due to network or GraphQL error:', error);
      throw error; // Re-throw to fail the test
    }
  });
});