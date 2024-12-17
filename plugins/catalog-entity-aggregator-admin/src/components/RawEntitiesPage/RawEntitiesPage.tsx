import React, { useEffect, useState } from 'react';
import { useRouteRefParams } from '@backstage/core-plugin-api';
import { rawEntitiesRouteRef } from '../../routes';
import { Content, Header, Page, Progress, ResponseErrorPanel, InfoCard, Table, TableColumn } from '@backstage/core-components';

type RawEntity = {
  dataSource: string;
  entity: {
    apiVersion: string;
    kind: string;
    metadata: {
      name: string;
      namespace?: string;
      annotations?: Record<string,string>;
      [key: string]: any;
    };
    spec: Record<string, any>;
  };
};

type AggregatorResponse = {
  rawEntities: RawEntity[];
  entity: Record<string, any>;
};

export const RawEntitiesPage = () => {
  const { namespace, kind, name } = useRouteRefParams(rawEntitiesRouteRef);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | undefined>();
  const [data, setData] = useState<AggregatorResponse | undefined>();

  useEffect(() => {
    let canceled = false;
    setLoading(true);

    fetch(`http://localhost:7007/aggregator/admin/raw-entities/${namespace}/${kind}/${name}`)
      .then(async resp => {
        if (!resp.ok) {
          throw new Error(`Failed to fetch raw entities: ${resp.status} ${resp.statusText}`);
        }
        const json = await resp.json();
        if (!canceled) {
          setData(json);
          setLoading(false);
        }
      })
      .catch(err => {
        if (!canceled) {
          setError(err);
          setLoading(false);
        }
      });

    return () => {
      canceled = true;
    };
  }, [namespace, kind, name]);

  if (loading) {
    return <Page themeId="tool"><Header title="Raw Entities" /><Content><Progress /></Content></Page>;
  }

  if (error) {
    return <Page themeId="tool"><Header title="Raw Entities" /><Content><ResponseErrorPanel error={error} /></Content></Page>;
  }

  if (!data) {
    return <Page themeId="tool"><Header title="Raw Entities" /><Content>No data</Content></Page>;
  }

  const rawEntities = data.rawEntities;
  const mergedEntity = data.entity;

  const columns: TableColumn<RawEntity>[] = [
    { title: 'Data Source', field: 'dataSource' },
    { title: 'Kind', field: 'entity.kind' },
    { title: 'Name', field: 'entity.metadata.name' },
    { title: 'Namespace', field: 'entity.metadata.namespace' },
  ];

  return (
    <Page themeId="tool">
      <Header title={`Raw Entities - ${kind}:${namespace}/${name}`} />
      <Content>
        <InfoCard title="Merged Entity">
          <pre>{JSON.stringify(mergedEntity, null, 2)}</pre>
        </InfoCard>
        <InfoCard title="Raw Entities" style={{ marginTop: 20 }}>
          <Table
            columns={columns}
            data={rawEntities}
            options={{ search: false, paging: false }}
          />
          <div style={{ marginTop: 20 }}>
            <h3>Raw JSON:</h3>
            <pre>{JSON.stringify(rawEntities, null, 2)}</pre>
          </div>
        </InfoCard>
      </Content>
    </Page>
  );
};