
/* <ai_context>
Component that displays various entity relationship cards in a grid layout
</ai_context> */

import React from 'react';
import { Grid } from '@mui/material';
import { useEntity } from '@backstage/plugin-catalog-react';
import { 
  EntityConsumedApisCard, 
  EntityProvidedApisCard 
} from './apiCards';
import { 
  EntityDependsOnComponentsCard, 
  EntityDependsOnResourcesCard, 
  EntityHasSubcomponentsCard 
} from './catalogCards';
import { Content, Page, Header } from '@backstage/core-components';

/**
 * Component that displays various entity relationship cards in a grid layout
 */
export const IntegrationsPage = () => {
  const { entity } = useEntity();

  return (
    <Page themeId="tool">
      <Header title="Integrations" subtitle="Entity relationship diagrams" />
      <Content>
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <h2>API Relationships</h2>
          </Grid>
          
          {/* API Cards */}
          <Grid item xs={12} md={6}>
            <EntityConsumedApisCard />
          </Grid>
          <Grid item xs={12} md={6}>
            <EntityProvidedApisCard />
          </Grid>
          
          <Grid item xs={12}>
            <h2>Catalog Relationships</h2>
          </Grid>
          
          {/* Catalog Cards */}
          <Grid item xs={12} md={6}>
            <EntityDependsOnComponentsCard />
          </Grid>
          <Grid item xs={12} md={6}>
            <EntityDependsOnResourcesCard />
          </Grid>
          <Grid item xs={12} md={6}>
            <EntityHasSubcomponentsCard />
          </Grid>
        </Grid>
      </Content>
    </Page>
  );
};
      