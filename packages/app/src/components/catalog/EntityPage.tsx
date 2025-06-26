import React from 'react';
import { Box, Button, Grid, Typography, Card, CardContent, LinearProgress, Chip } from '@material-ui/core';
import { CustomInfoCard, SkimStats } from 'common-components';
import {
  EntityApiDefinitionCard,
  EntityConsumedApisCard,
  EntityConsumingComponentsCard,
  EntityHasApisCard,
  EntityProvidedApisCard,
  EntityProvidingComponentsCard,
} from '@backstage/plugin-api-docs';
import {
  EntityAboutCard,
  EntityDependsOnComponentsCard,
  EntityDependsOnResourcesCard,
  EntityHasComponentsCard,
  EntityHasResourcesCard,
  EntityHasSubcomponentsCard,
  EntityHasSystemsCard,
  EntityLayout,
  EntityLinksCard,
  EntitySwitch,
  EntityOrphanWarning,
  EntityProcessingErrorsPanel,
  isComponentType,
  isKind,
  hasCatalogProcessingErrors,
  isOrphan,
  hasRelationWarnings,
  EntityRelationWarning,
} from '@backstage/plugin-catalog';
import {
  EntityUserProfileCard,
  EntityGroupProfileCard,
  EntityMembersListCard,
  EntityOwnershipCard,
} from '@backstage/plugin-org';
import { EntityTechdocsContent } from '@backstage/plugin-techdocs';
import { EmptyState } from '@backstage/core-components';
import {
  Direction,
  EntityCatalogGraphCard,
} from '@backstage/plugin-catalog-graph';
import {
  RELATION_API_CONSUMED_BY,
  RELATION_API_PROVIDED_BY,
  RELATION_CONSUMES_API,
  RELATION_DEPENDENCY_OF,
  RELATION_DEPENDS_ON,
  RELATION_HAS_PART,
  RELATION_PART_OF,
  RELATION_PROVIDES_API,
} from '@backstage/catalog-model';
import { MissingAnnotationsCard } from 'common-components';
import { PreuseCard } from 'common-components';

import { TechDocsAddons } from '@backstage/plugin-techdocs-react';
import { ReportIssue } from '@backstage/plugin-techdocs-module-addons-contrib';
import {
  EntityKubernetesContent,
  isKubernetesAvailable,
} from '@backstage/plugin-kubernetes';
import Accordion from 'common-components/src/components/Accordian/Accordian';

const techdocsContent = (
  <EntityTechdocsContent>
    <TechDocsAddons>
      <ReportIssue />
    </TechDocsAddons>
  </EntityTechdocsContent>
);

const cicdContent = (
  <EntitySwitch>
    <EntitySwitch.Case>
      <EmptyState
        title="No CI/CD available for this entity"
        missing="info"
        description="You need to add an annotation to your component if you want to enable CI/CD for it. You can read more about annotations in Backstage by clicking the button below."
        action={
          <Button
            variant="contained"
            color="primary"
            href="https://backstage.io/docs/features/software-catalog/well-known-annotations"
          >
            Read more
          </Button>
        }
      />
    </EntitySwitch.Case>
  </EntitySwitch>
);

const entityWarningContent = (
  <>
    <EntitySwitch>
      <EntitySwitch.Case if={isOrphan}>
        <Grid item xs={12}>
          <EntityOrphanWarning />
        </Grid>
      </EntitySwitch.Case>
    </EntitySwitch>

    <EntitySwitch>
      <EntitySwitch.Case if={hasRelationWarnings}>
        <Grid item xs={12}>
          <EntityRelationWarning />
        </Grid>
      </EntitySwitch.Case>
    </EntitySwitch>

    <EntitySwitch>
      <EntitySwitch.Case if={hasCatalogProcessingErrors}>
        <Grid item xs={12}>
          <EntityProcessingErrorsPanel />
        </Grid>
      </EntitySwitch.Case>
    </EntitySwitch>
  </>
);

const overviewContent = (
  <Grid container spacing={3} alignItems="stretch">
    {entityWarningContent}
    <Grid item md={6}>
      <EntityAboutCard variant="gridItem" />
    </Grid>
    <Grid item md={6} xs={12}>
      <EntityCatalogGraphCard variant="gridItem" height={400} />
    </Grid>
    <Grid item md={4} xs={12}>
      <EntityLinksCard />
    </Grid>
    <Grid item md={8} xs={12}>
      <EntityHasSubcomponentsCard variant="gridItem" />
    </Grid>
    <Grid item md={6} xs={12}>
      <MissingAnnotationsCard
        title="Example Single Annotation"
        annotation="my/annotation"
      />
    </Grid>
    <Grid item md={6} xs={12}>
      <MissingAnnotationsCard
        title="Example Multiple Annotations"
        annotation={["ann1", "ann2"]}
      />
    </Grid>
    <Grid item md={6} xs={12}>
      <Accordion
        items={[
          {
            id: '1',
            header: 'What is Lorem Ipsum?',
            body: 'Lorem Ipsum is simply dummy text of the printing and typesetting industry.',
          },
          {
            id: '2',
            header: 'Why do we use it?',
            body: 'It is a long established fact that a reader will be distracted by the readable content of a page when looking at its layout.',
          },
          {
            id: '3',
            header: 'Where does it come from?',
            body: 'Contrary to popular belief, Lorem Ipsum is not simply random text. It has roots in a piece of classical Latin literature from 45 BC.',
          },
        ]}
      />
    </Grid>

<Grid container spacing={3} alignItems="stretch">
  {/* ─────────────── FULL-WIDTH CARD ─────────────── */}
  <Grid item md={12} xs={12}>
    <CustomInfoCard
      title="Service Performance Stats"
      subheader="Real-time metrics and insights"
      dataSources={['Prometheus', 'Grafana', 'Jaeger']}
      skimContentError
      skimContent={
        <SkimStats
          metrics={[
            { label: 'Uptime', value: '99.9%' },
            { label: 'Errors', value: '0.1%' },
            { label: 'Avg Latency', value: '24 ms' },
          ]}
        />
      }
      footerButtonsComponent={
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button variant="outlined" size="small">View Details</Button>
          <Button variant="contained" size="small">Refresh</Button>
        </Box>
      }
      menuActions={[
        { label: 'Export Data', onClick: () => console.log('Export') },
        { label: 'Configure Alerts', onClick: () => console.log('Configure') },
        { label: 'Historical View', onClick: () => console.log('History') },
      ]}
    >
      {/* ------------- same detailed content ------------- */}
      {/* Response Time */}
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
            <Typography variant="body2" color="textSecondary">Average Response Time</Typography>
            <Chip label="24 ms" color="primary" size="small" />
          </Box>
          <LinearProgress variant="determinate" value={75} sx={{ height: 8, borderRadius: 4 }} />
        </Box>
        {/* Uptime */}
        <Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
            <Typography variant="body2" color="textSecondary">Service Uptime</Typography>
            <Chip label="99.9%" color="success" size="small" />
          </Box>
          <LinearProgress variant="determinate" value={99.9} sx={{ height: 8, borderRadius: 4 }} />
        </Box>
        {/* Error Rate */}
        <Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
            <Typography variant="body2" color="textSecondary">Error Rate</Typography>
            <Chip label="0.1%" color="error" size="small" />
          </Box>
          <LinearProgress variant="determinate" value={0.1} sx={{ height: 8, borderRadius: 4 }} />
        </Box>
        {/* Throughput */}
        <Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
            <Typography variant="body2" color="textSecondary">Requests/min</Typography>
            <Chip label="1 234" color="info" size="small" />
          </Box>
          <LinearProgress variant="determinate" value={85} sx={{ height: 8, borderRadius: 4 }} />
        </Box>
        {/* Resource Usage */}
        <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
          <Card sx={{ flex: 1, p: 1.5 }}>
            <Typography variant="body2" color="textSecondary" gutterBottom>CPU Usage</Typography>
            <Typography variant="h6" color="primary">34%</Typography>
          </Card>
          <Card sx={{ flex: 1, p: 1.5 }}>
            <Typography variant="body2" color="textSecondary" gutterBottom>Memory</Typography>
            <Typography variant="h6" color="warning.main">78%</Typography>
          </Card>
          <Card sx={{ flex: 1, p: 1.5 }}>
            <Typography variant="body2" color="textSecondary" gutterBottom>Storage</Typography>
            <Typography variant="h6" color="success.main">45%</Typography>
          </Card>
        </Box>
      </Box>
    </CustomInfoCard>
  </Grid>

  {/* ─────────────── HALF-WIDTH CARD ─────────────── */}
  <Grid item md={6} xs={12}>
    <CustomInfoCard
      title="Service Performance Stats"
      subheader="Real-time metrics and insights"
      dataSources={['Prometheus', 'Grafana', 'Jaeger']}
      skimContent={
        <SkimStats
          metrics={[
            { label: 'Uptime', value: '99.9%' },
            { label: 'Errors', value: '0.1%' },
            { label: 'Avg Latency', value: '24 ms' },
          ]}
        />
      }
      footerButtonsComponent={
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button variant="outlined" size="small">View Details</Button>
          <Button variant="contained" size="small">Refresh</Button>
        </Box>
      }
      menuActions={[
        { label: 'Export Data', onClick: () => console.log('Export') },
        { label: 'Configure Alerts', onClick: () => console.log('Configure') },
        { label: 'Historical View', onClick: () => console.log('History') },
      ]}
    >
      {/* identical detailed content as above */}
      {/* …(copy the same inner <Box> block used in the full-width card)… */}
    </CustomInfoCard>
  </Grid>
</Grid>

  </Grid>
);

const serviceEntityPage = (
  <EntityLayout>
    <EntityLayout.Route path="/" title="Overview">
      {overviewContent}
    </EntityLayout.Route>

    <EntityLayout.Route path="/ci-cd" title="CI/CD">
      {cicdContent}
    </EntityLayout.Route>

    <EntityLayout.Route
      path="/kubernetes"
      title="Kubernetes"
      if={isKubernetesAvailable}
    >
      <EntityKubernetesContent />
    </EntityLayout.Route>

    <EntityLayout.Route path="/api" title="API">
      <Grid container spacing={3} alignItems="stretch">
        <Grid item md={6}>
          <EntityProvidedApisCard />
        </Grid>
        <Grid item md={6}>
          <EntityConsumedApisCard />
        </Grid>
      </Grid>
    </EntityLayout.Route>

    <EntityLayout.Route path="/dependencies" title="Dependencies">
      <Grid container spacing={3} alignItems="stretch">
        <Grid item md={6}>
          <EntityDependsOnComponentsCard variant="gridItem" />
        </Grid>
        <Grid item md={6}>
          <EntityDependsOnResourcesCard variant="gridItem" />
        </Grid>
      </Grid>
    </EntityLayout.Route>

    <EntityLayout.Route path="/docs" title="Docs">
      {techdocsContent}
    </EntityLayout.Route>
  </EntityLayout>
);

const websiteEntityPage = (
  <EntityLayout>
    <EntityLayout.Route path="/" title="Overview">
      {overviewContent}
    </EntityLayout.Route>

    <EntityLayout.Route path="/ci-cd" title="CI/CD">
      {cicdContent}
    </EntityLayout.Route>

    <EntityLayout.Route
      path="/kubernetes"
      title="Kubernetes"
      if={isKubernetesAvailable}
    >
      <EntityKubernetesContent />
    </EntityLayout.Route>

    <EntityLayout.Route path="/dependencies" title="Dependencies">
      <Grid container spacing={3} alignItems="stretch">
        <Grid item md={6}>
          <EntityDependsOnComponentsCard variant="gridItem" />
        </Grid>
        <Grid item md={6}>
          <EntityDependsOnResourcesCard variant="gridItem" />
        </Grid>
      </Grid>
    </EntityLayout.Route>

    <EntityLayout.Route path="/docs" title="Docs">
      {techdocsContent}
    </EntityLayout.Route>
  </EntityLayout>
);

const defaultEntityPage = (
  <EntityLayout>
    <EntityLayout.Route path="/" title="Overview">
      {overviewContent}
    </EntityLayout.Route>

    <EntityLayout.Route path="/docs" title="Docs">
      {techdocsContent}
    </EntityLayout.Route>
  </EntityLayout>
);

const componentPage = (
  <EntitySwitch>
    <EntitySwitch.Case if={isComponentType('service')}>
      {serviceEntityPage}
    </EntitySwitch.Case>

    <EntitySwitch.Case if={isComponentType('website')}>
      {websiteEntityPage}
    </EntitySwitch.Case>

    <EntitySwitch.Case>{defaultEntityPage}</EntitySwitch.Case>
  </EntitySwitch>
);

const apiPage = (
  <EntityLayout>
    <EntityLayout.Route path="/" title="Overview">
      <Grid container spacing={3}>
        {entityWarningContent}
        <Grid item md={6}>
          <EntityAboutCard />
        </Grid>
        <Grid item md={6} xs={12}>
          <EntityCatalogGraphCard variant="gridItem" height={400} />
        </Grid>
        <Grid item md={4} xs={12}>
          <EntityLinksCard />
        </Grid>
        <Grid container item md={12}>
          <Grid item md={6}>
            <EntityProvidingComponentsCard />
          </Grid>
          <Grid item md={6}>
            <EntityConsumingComponentsCard />
          </Grid>
        </Grid>
      </Grid>
    </EntityLayout.Route>

    <EntityLayout.Route path="/definition" title="Definition">
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <EntityApiDefinitionCard />
        </Grid>
      </Grid>
    </EntityLayout.Route>
  </EntityLayout>
);

const userPage = (
  <EntityLayout>
    <EntityLayout.Route path="/" title="Overview">
      <Grid container spacing={3}>
        {entityWarningContent}
        <Grid item xs={12} md={6}>
          <EntityUserProfileCard variant="gridItem" />
        </Grid>
        <Grid item xs={12} md={6}>
          <EntityOwnershipCard variant="gridItem" />
        </Grid>
      </Grid>
    </EntityLayout.Route>
  </EntityLayout>
);

const groupPage = (
  <EntityLayout>
    <EntityLayout.Route path="/" title="Overview">
      <Grid container spacing={3}>
        {entityWarningContent}
        <Grid item xs={12} md={6}>
          <EntityGroupProfileCard variant="gridItem" />
        </Grid>
        <Grid item xs={12} md={6}>
          <EntityOwnershipCard variant="gridItem" />
        </Grid>
        <Grid item xs={12} md={6}>
          <EntityMembersListCard />
        </Grid>
        <Grid item xs={12} md={6}>
          <EntityLinksCard />
        </Grid>
      </Grid>
    </EntityLayout.Route>
  </EntityLayout>
);

const systemPage = (
  <EntityLayout>
    <EntityLayout.Route path="/" title="Overview">
      <Grid container spacing={3} alignItems="stretch">
        {entityWarningContent}
        <Grid item md={6}>
          <EntityAboutCard variant="gridItem" />
        </Grid>
        <Grid item md={6} xs={12}>
          <EntityCatalogGraphCard variant="gridItem" height={400} />
        </Grid>
        <Grid item md={4} xs={12}>
          <EntityLinksCard />
        </Grid>
        <Grid item md={8}>
          <EntityHasComponentsCard variant="gridItem" />
        </Grid>
        <Grid item md={6}>
          <EntityHasApisCard variant="gridItem" />
        </Grid>
        <Grid item md={6}>
          <EntityHasResourcesCard variant="gridItem" />
        </Grid>
      </Grid>
    </EntityLayout.Route>

    <EntityLayout.Route path="/diagram" title="Diagram">
      <EntityCatalogGraphCard
        variant="gridItem"
        direction={Direction.TOP_BOTTOM}
        title="System Diagram"
        height={700}
        relations={[
          RELATION_PART_OF,
          RELATION_HAS_PART,
          RELATION_API_CONSUMED_BY,
          RELATION_API_PROVIDED_BY,
          RELATION_CONSUMES_API,
          RELATION_PROVIDES_API,
          RELATION_DEPENDENCY_OF,
          RELATION_DEPENDS_ON,
        ]}
        unidirectional={false}
      />
    </EntityLayout.Route>
  </EntityLayout>
);

const domainPage = (
  <EntityLayout>
    <EntityLayout.Route path="/" title="Overview">
      <Grid container spacing={3} alignItems="stretch">
        {entityWarningContent}
        <Grid item md={6}>
          <EntityAboutCard variant="gridItem" />
        </Grid>
        <Grid item md={6} xs={12}>
          <EntityCatalogGraphCard variant="gridItem" height={400} />
        </Grid>
        <Grid item md={6}>
          <EntityHasSystemsCard variant="gridItem" />
        </Grid>
      </Grid>
    </EntityLayout.Route>
  </EntityLayout>
);

export const entityPage = (
  <EntitySwitch>
    <EntitySwitch.Case if={isKind('component')} children={componentPage} />
    <EntitySwitch.Case if={isKind('api')} children={apiPage} />
    <EntitySwitch.Case if={isKind('group')} children={groupPage} />
    <EntitySwitch.Case if={isKind('user')} children={userPage} />
    <EntitySwitch.Case if={isKind('system')} children={systemPage} />
    <EntitySwitch.Case if={isKind('domain')} children={domainPage} />
    <EntitySwitch.Case>{defaultEntityPage}</EntitySwitch.Case>
  </EntitySwitch>
);