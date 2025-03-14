
import { RELATION_PROVIDES_API } from '@backstage/catalog-model';
import React from 'react';
import { EntityApiRelationshipCard } from './EntityApiRelationshipCard';

export const EntityProvidedApisCard = () => {
  return (
    <EntityApiRelationshipCard
      relationType={RELATION_PROVIDES_API}
      emptyMessage="This entity does not provide any APIs"
    />
  );
};
      