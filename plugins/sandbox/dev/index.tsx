import React from 'react';
import { createDevApp } from '@backstage/dev-utils';
import { Grid, Typography, Box } from '@material-ui/core';
import { CustomInfoCard } from '../src/components/CustomInfoCard/CustomInfoCard';
import SupportCard from '../src/components/SupportCard/SupportCard';

// Mock data for SupportCard
const mockApplicationInfo = {
  rbfGovernedRating: "High",
  productId: "PROD-123",
  itProductManager: "Jane Doe",
  appId: "APP-456",
  description: "Critical banking application",
  productName: "Banking Portal",
  secondaryIncidentGroups: "GROUP-789",
  productLineDescription: "Consumer Banking Products",
  primaryIncidentGroups: "GROUP-123",
  productLineDisplayName: "Consumer Banking",
  businessProductManager: "John Manager",
  securityLevel: "High",
  productLineName: "consumer-banking",
  appDisplayName: "Banking Portal Pro",
  appDevManager: "Bob Developer",
  productDescription: "Enterprise banking solution",
  appName: "banking-portal",
  criticalityCode: "1",
  infraAndAppApprovalGroups: "GROUP-999",
  nonProdApprovalGroups: "GROUP-888",
  appOnlyApprovalGroups: "GROUP-777"
};

const mockIncidentGroups = [
  {
    groupId: "primary-123",
    type: "primary",
    typeVal: "Primary Support",
    details: {
      id: "g-123",
      managerEmail: "manager1@company.com",
      managerName: "Primary Manager",
      manager: "Primary Manager",
      name: "Primary Support Team",
      description: "Primary support for banking applications",
      email: "primary-support@company.com"
    }
  },
  {
    groupId: "secondary-456",
    type: "secondary",
    typeVal: "Secondary Support",
    details: {
      id: "g-456",
      managerEmail: "manager2@company.com",
      managerName: "Secondary Manager",
      manager: "Secondary Manager",
      name: "Secondary Support Team",
      description: "Secondary support for banking applications",
      email: "secondary-support@company.com"
    }
  }
];

createDevApp()
  .addPage({
    element: (
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Typography variant="h4" gutterBottom>
            Support Card Example
          </Typography>
        </Grid>
        <Grid item xs={12}>
          <SupportCard
            applicationInfo={mockApplicationInfo}
            supportInfo="Additional support information here"
            incidentGroups={mockIncidentGroups}
          />
        </Grid>
      </Grid>
    ),
    title: 'Support Card Example',
    path: '/support-card',
  })
  .addPage({
    element: (
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Typography variant="h4" gutterBottom>
            CustomInfoCard Examples
          </Typography>
        </Grid>

        {/* Basic Card */}
        <Grid item xs={12} md={6}>
          <CustomInfoCard title="Basic Card">
            <Box p={2}>
              <Typography>Basic card with only title and content.</Typography>
            </Box>
          </CustomInfoCard>
        </Grid>

        {/* Card with Subheader */}
        <Grid item xs={12} md={6}>
          <CustomInfoCard 
            title="Card with Subheader"
            subheader="This is a subheader"
          >
            <Box p={2}>
              <Typography>Card content with a subheader above.</Typography>
            </Box>
          </CustomInfoCard>
        </Grid>

        {/* Card with Single Data Source */}
        <Grid item xs={12} md={6}>
          <CustomInfoCard 
            title="Single Data Source"
            dataSources={[
              { source: 'https://example.com', name: 'Example' }
            ]}
          >
            <Box p={2}>
              <Typography>Card with a single data source button.</Typography>
            </Box>
          </CustomInfoCard>
        </Grid>

        {/* Card with Multiple Data Sources */}
        <Grid item xs={12} md={6}>
          <CustomInfoCard 
            title="Multiple Data Sources"
            dataSources={[
              { source: 'https://example1.com', name: 'Source 1' },
              { source: 'https://example2.com', name: 'Source 2' },
              { source: 'https://example3.com', name: 'Source 3' }
            ]}
          >
            <Box p={2}>
              <Typography>Card showing multiple data sources with separator.</Typography>
            </Box>
          </CustomInfoCard>
        </Grid>

        {/* Card with Menu Actions */}
        <Grid item xs={12} md={6}>
          <CustomInfoCard 
            title="Menu Actions"
            menuActions={[
              { label: 'Edit', onClick: () => console.log('Edit clicked') },
              { label: 'Delete', onClick: () => console.log('Delete clicked') }
            ]}
          >
            <Box p={2}>
              <Typography>Card with menu actions in top-right corner.</Typography>
            </Box>
          </CustomInfoCard>
        </Grid>

        {/* Full Featured Card */}
        <Grid item xs={12} md={6}>
          <CustomInfoCard 
            title="Full Featured Card"
            subheader="Complete example with all features"
            dataSources={[
              { source: 'https://example1.com', name: 'Primary' },
              { source: 'https://example2.com', name: 'Secondary' }
            ]}
            menuActions={[
              { label: 'Edit', onClick: () => console.log('Edit clicked') },
              { label: 'Share', onClick: () => console.log('Share clicked') },
              { label: 'Delete', onClick: () => console.log('Delete clicked') }
            ]}
          >
            <Box p={2}>
              <Typography variant="body1" gutterBottom>
                This card demonstrates all available features:
              </Typography>
              <ul>
                <li>Title and subheader</li>
                <li>Multiple data sources with separator</li>
                <li>Menu actions in dropdown</li>
                <li>Custom content styling</li>
              </ul>
            </Box>
          </CustomInfoCard>
        </Grid>
      </Grid>
    ),
    title: 'Gotham Components Example',
    path: '/gotham-components',
  })
  .render();