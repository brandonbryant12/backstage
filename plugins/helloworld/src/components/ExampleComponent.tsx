/* <ai_context>
A basic example component that serves as the root page for the helloworld plugin.
</ai_context> */

import React from 'react';
import { Typography, Grid, Button } from '@mui/material';
import {
  InfoCard,
  Header,
  Page,
  Content,
  ContentHeader,
  HeaderLabel,
  SupportButton,
} from '@backstage/core-components';
import { useRouteRef } from '@backstage/core-plugin-api';
import { catalogCardsRouteRef, apiCardsRouteRef } from '../routes';

export const ExampleComponent = () => {
  const catalogCardsLink = useRouteRef(catalogCardsRouteRef);
  const apiCardsLink = useRouteRef(apiCardsRouteRef);

  return (
    <Page themeId="tool">
      <Header title="Welcome to Helloworld!" subtitle="Backstage Plugin Example">
        <HeaderLabel label="Owner" value="Team X" />
        <HeaderLabel label="Lifecycle" value="Alpha" />
      </Header>
      <Content>
        <ContentHeader title="Available Card Examples">
          <SupportButton>This plugin shows example usages of catalog and API cards.</SupportButton>
        </ContentHeader>
        <Grid container spacing={3} direction="column">
          <Grid item>
            <InfoCard title="Catalog Cards">
              <Typography paragraph>
                View examples of catalog relationship cards such as dependencies, resources, and subcomponents.
              </Typography>
              <Button variant="contained" color="primary" href={catalogCardsLink()}>
                View Catalog Cards
              </Button>
            </InfoCard>
          </Grid>
          <Grid item>
            <InfoCard title="API Cards">
              <Typography paragraph>
                View examples of API relationship cards such as consumed and provided APIs.
              </Typography>
              <Button variant="contained" color="primary" href={apiCardsLink()}>
                View API Cards
              </Button>
            </InfoCard>
          </Grid>
        </Grid>
      </Content>
    </Page>
  );
};
