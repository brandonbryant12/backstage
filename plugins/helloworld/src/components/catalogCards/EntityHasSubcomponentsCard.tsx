
import { RELATION_HAS_PART } from '@backstage/catalog-model';
import React from 'react';
import { EntityRelatedEntitiesCard } from './EntityRelatedEntitiesCard';

export function EntityHasSubcomponentsCard() {
  return (
    <EntityRelatedEntitiesCard
      relationType={RELATION_HAS_PART}
      emptyMessage="No subcomponent is part of this component"
    />
  );
}
      