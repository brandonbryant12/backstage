
import {
  Entity,
  CompoundEntityRef,
  RELATION_OWNED_BY,
  RELATION_PART_OF,
} from '@backstage/catalog-model';
import { OverflowTooltip, TableColumn } from '@backstage/core-components';
import React from 'react';
import { getEntityRelations } from '@backstage/plugin-catalog-react';
import {
  EntityRefLink,
  EntityRefLinks,
  humanizeEntityRef,
} from '@backstage/plugin-catalog-react';

export const columnFactories = Object.freeze({
  createEntityRefColumn<T extends Entity>(): TableColumn<T> {
    function formatContent(entity: T): string {
      return (
        entity.metadata?.title ||
        humanizeEntityRef(entity)
      );
    }

    return {
      title: 'Name',
      highlight: true,
      customFilterAndSearch(filter, entity) {
        return formatContent(entity).includes(filter);
      },
      customSort(entity1, entity2) {
        return formatContent(entity1).localeCompare(formatContent(entity2));
      },
      render: entity => (
        <EntityRefLink
          entityRef={entity}
          title={entity.metadata?.title}
        />
      ),
    };
  },
  createEntityRelationColumn<T extends Entity>(options: {
    title: string;
    relation: string;
    filter?: { kind: string };
  }): TableColumn<T> {
    const { title, relation, filter: entityFilter } = options;

    function getRelations(entity: T): CompoundEntityRef[] {
      return getEntityRelations(entity, relation, entityFilter);
    }

    function formatContent(entity: T): string {
      return getRelations(entity)
        .map(r => humanizeEntityRef(r))
        .join(', ');
    }

    return {
      title,
      customFilterAndSearch(filter, entity) {
        return formatContent(entity).includes(filter);
      },
      customSort(entity1, entity2) {
        return formatContent(entity1).localeCompare(formatContent(entity2));
      },
      render: entity => (
        <EntityRefLinks
          entityRefs={getRelations(entity)}
        />
      ),
    };
  },
  createOwnerColumn<T extends Entity>(): TableColumn<T> {
    return this.createEntityRelationColumn({
      title: 'Owner',
      relation: RELATION_OWNED_BY,
    });
  },
  createDomainColumn<T extends Entity>(): TableColumn<T> {
    return this.createEntityRelationColumn({
      title: 'Domain',
      relation: RELATION_PART_OF,
      filter: {
        kind: 'domain',
      },
    });
  },
  createSystemColumn<T extends Entity>(): TableColumn<T> {
    return this.createEntityRelationColumn({
      title: 'System',
      relation: RELATION_PART_OF,
    });
  },
  createMetadataDescriptionColumn<T extends Entity>(): TableColumn<T> {
    return {
      title: 'Description',
      field: 'metadata.description',
      render: entity => (
        <OverflowTooltip
          text={entity.metadata.description}
          placement="bottom-start"
          line={2}
        />
      ),
    };
  },
  createSpecLifecycleColumn<T extends Entity>(): TableColumn<T> {
    return {
      title: 'Lifecycle',
      field: 'spec.lifecycle',
    };
  },
  createSpecTypeColumn<T extends Entity>(): TableColumn<T> {
    return {
      title: 'Type',
      field: 'spec.type',
    };
  },
});
      