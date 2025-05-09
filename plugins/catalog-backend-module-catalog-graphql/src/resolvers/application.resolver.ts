import { GraphQLContext } from '../types';

export const applicationResolvers = {
  Query: {
    applicationById: async (
      _parent: unknown,
      { id }: { id: string },
      context: GraphQLContext,
    ) => context.applicationService.findById(id),
  },
  Application: {
    __resolveReference: async (
      reference: { id: string },
      context: GraphQLContext,
    ) => context.applicationService.findById(reference.id),
    id: (root: any) => root.id,
    name: (root: any) => root.name,
    description: (root: any) => root.description,
    agileEntityName: (root: any) => root.agileEntityName,
  },
};