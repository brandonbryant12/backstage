
import { RELATION_DEPENDS_ON } from '@backstage/catalog-model';
import React from 'react';
import { EntityRelatedEntitiesCard } from './EntityRelatedEntitiesCard';

export function EntityDependsOnComponentsCard() {
  return (
    <EntityRelatedEntitiesCard
      relationType={RELATION_DEPENDS_ON}
      emptyMessage="No component is a dependency of this component"
    />
  );
}
      