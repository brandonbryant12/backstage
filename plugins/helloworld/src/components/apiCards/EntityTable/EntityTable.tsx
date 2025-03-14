
import { Entity } from '@backstage/catalog-model';
import { styled } from '@mui/material/styles';
import React, { ReactNode } from 'react';
import { columnFactories } from './columns';

import {
  Table,
  TableColumn,
  TableOptions,
} from '@backstage/core-components';

interface EntityTableProps<T extends Entity> {
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

export const EntityTable = <T extends Entity>(props: EntityTableProps<T>) => {
  const {
    entities,
    emptyContent,
    columns,
    tableOptions = {},
  } = props;

  const hasData = entities && entities.length > 0;
  const paging = hasData ? true : false;

  return (
    <Table<T>
      columns={columns}
      style={{ width: '100%' }}
      emptyContent={emptyContent && <EmptyContent>{emptyContent}</EmptyContent>}
      options={{
        search: false,
        paging,
        pageSize: 10,
        padding: 'dense',
        draggable: false,
        toolbar: false,
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
      