import { RELATION_DEPENDS_ON } from '@backstage/catalog-model';
import React from 'react';
import { EntityRelatedEntitiesCard } from './EntityRelatedEntitiesCard';

export function EntityDependsOnResourcesCard() {
  
  return (
    <EntityRelatedEntitiesCard
      relationType={RELATION_DEPENDS_ON}
      emptyMessage="No resource is a dependency of this component"
    />
  );
}