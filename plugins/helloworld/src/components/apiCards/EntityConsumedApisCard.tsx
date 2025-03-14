
import { RELATION_CONSUMES_API } from '@backstage/catalog-model';
import React from 'react';
import { EntityApiRelationshipCard } from './EntityApiRelationshipCard';

export const EntityConsumedApisCard = () => {
  
  return (
    <EntityApiRelationshipCard
      relationType={RELATION_CONSUMES_API}
      emptyMessage="This entity does not consume any APIs"
    />
  );
};
      