import { useQuery } from '@apollo/client/react';
import {
  GetApplicationDocument,
  type GetApplicationQuery,
  type GetApplicationQueryVariables,
} from '../__generated__/graphql';

/**
 * useApplication loads the Application entity from the supergraph.
 *
 * @param id Backstage entity ID (metadata.name)
 */
export const useApplication = (id: string) => {
  const { data, loading, error, refetch } = useQuery<
    GetApplicationQuery,
    GetApplicationQueryVariables
  >(GetApplicationDocument, { variables: { id } });

  return {
    application: data?.applicationById,
    loading,
    error,
    refetch,
  };
};