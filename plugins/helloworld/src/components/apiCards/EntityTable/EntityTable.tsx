// Updates to plugins/helloworld/src/components/apiCards/EntityTable/EntityTable.tsx
import { Entity } from '@backstage/catalog-model';
import { styled } from '@mui/material/styles';
import React, { ReactNode } from 'react';
import { columnFactories } from './columns';
import { componentEntityColumns, systemEntityColumns } from './presets';
import {
  InfoCardVariants,
  Table,
  TableColumn,
  TableOptions,
} from '@backstage/core-components';

/**
 * Props for EntityTable.
 */
export interface EntityTableProps<T extends Entity> {
  title: string;
  variant?: InfoCardVariants;
  entities: T[];
  emptyContent?: ReactNode;
  columns: TableColumn<T>[];
  tableOptions?: TableOptions;
}

const EmptyContent = styled('div')(({ theme }) => ({
  padding: theme.spacing(2),
  display: 'flex',
  justifyContent: 'center',
}));

/**
 * A general entity table component, that can be used for composing more
 * specific entity tables.
 */
export const EntityTable = <T extends Entity>(props: EntityTableProps<T>) => {
  const {
    entities,
    title,
    emptyContent,
    variant = 'gridItem',
    columns,
    tableOptions = {},
  } = props;

  const tableStyle: React.CSSProperties = {
    minWidth: '0',
    width: '100%',
  };

  if (variant === 'gridItem') {
    tableStyle.height = 'calc(100% - 10px)';
  }

  return (
    <Table<T>
      columns={columns}
      title={title}
      style={tableStyle}
      emptyContent={
        emptyContent && <EmptyContent>{emptyContent}</EmptyContent>
      }
      options={{
        search: false,
        paging: true,
        pageSize: 10,
        padding: 'dense',
        draggable: false,
        headerStyle: {
          borderTop: 'none',
          borderBottom: 'none',
        },
        ...tableOptions,
      }}
      data={entities}
    />
  );
};

EntityTable.columns = columnFactories;
EntityTable.systemEntityColumns = systemEntityColumns;
EntityTable.componentEntityColumns = componentEntityColumns;