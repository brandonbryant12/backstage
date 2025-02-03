import { createDevApp } from '@backstage/dev-utils';
import { Content, Page } from '@backstage/core-components';
import React from 'react';
import { catalogEntityAggregatorAdminPlugin, catalogEntityAggregatorAdminApiRef } from '../src';
import { mockCatalogEntityAggregatorAdminApi } from '../src/api/MockCatalogEntityAggregatorAdminApi';
import { ServicenowDeprecationBanner } from '../src/components/ServicenowDeprecationBanner';
import { DevWrapper } from './DevWrapper';

const ServicenowEntityPage = () => (
  <DevWrapper namespace="servicenow">
    <Page themeId="tool">
      <Content>
        <ServicenowDeprecationBanner />
        <h1>Servicenow Namespace Entity Page</h1>
        <p>This page demonstrates the deprecation banner for servicenow namespace.</p>
      </Content>
    </Page>
  </DevWrapper>
);

const DefaultEntityPage = () => (
  <DevWrapper namespace="default">
    <Page themeId="tool">
      <Content>
        <ServicenowDeprecationBanner />
        <h1>Default Namespace Entity Page</h1>
        <p>This page demonstrates no banner for default namespace.</p>
      </Content>
    </Page>
  </DevWrapper>
);

createDevApp()
  .registerPlugin(catalogEntityAggregatorAdminPlugin)
  .registerApi({
    api: catalogEntityAggregatorAdminApiRef,
    deps: {},
    factory: () => mockCatalogEntityAggregatorAdminApi,
  })
  .addPage({
    element: <ServicenowEntityPage />,
    title: 'Servicenow Entity Example',
    path: '/servicenow-example'
  })
  .addPage({
    element: <DefaultEntityPage />,
    title: 'Default Entity Example',
    path: '/default-example'
  })
  .render();