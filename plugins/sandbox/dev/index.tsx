import React from 'react';
import { createDevApp } from '@backstage/dev-utils';
import { EntityProvider } from '@backstage/plugin-catalog-react';
import { sandboxPlugin } from '../src/plugin';
import SupportCard from '../src/components/SupportCard/EntitySupportCard';
import Grid from '@material-ui/core/Grid';
import Typography from '@material-ui/core/Typography';

// Base mock entity
const createMockEntity = (annotations = {}) => ({
  apiVersion: 'backstage.io/v1alpha1',
  kind: 'Component',
  metadata: {
    name: 'mock-service',
    description: 'Mock service for development',
    annotations: {
      'Support': 'This is a mock support annotation',
      ...annotations,
    },
    tags: ['mock'],
  },
  spec: {
    type: 'service',
    lifecycle: 'production',
    owner: 'team-a',
    system: 'mock-system',
  },
});

// Scenario wrapper component
interface ScenarioWrapperProps {
  title: string;
  entity: Entity;
  mockStates: {
    application?: string;
    groups?: string;
    members?: string;
  };
}

const ScenarioWrapper = ({ title, entity, mockStates }: ScenarioWrapperProps) => (
  <Grid item xs={12}>
    <Typography variant="h6" gutterBottom>{title}</Typography>
    <EntityProvider entity={entity}>
      <SupportCard 
        entity={entity} 
        mockStates={mockStates}
      />
    </EntityProvider>
  </Grid>
);

// Dev scenarios
const scenarios = [
  {
    title: 'Default State',
    entity: createMockEntity(),
    mockStates: {},
  },
  {
    title: 'Loading Application',
    entity: createMockEntity(),
    mockStates: { application: 'loading' },
  },
  {
    title: 'Loading Groups',
    entity: createMockEntity(),
    mockStates: { groups: 'loading' },
  },
  {
    title: 'Loading Members',
    entity: createMockEntity(),
    mockStates: { members: 'loading' },
  },
  {
    title: 'Application Error',
    entity: createMockEntity(),
    mockStates: { application: 'error' },
  },
  {
    title: 'Empty Groups',
    entity: createMockEntity(),
    mockStates: { groups: 'empty' },
  },
  {
    title: 'Single Group',
    entity: createMockEntity(),
    mockStates: { groups: 'single' },
  },
  {
    title: 'No Members',
    entity: createMockEntity(),
    mockStates: { members: 'empty' },
  },
];

createDevApp()
  .registerPlugin(sandboxPlugin)
  .addPage({
    element: (
      <Grid container spacing={3}>
        {scenarios.map((scenario, index) => (
          <ScenarioWrapper 
            key={index}
            title={scenario.title}
            entity={scenario.entity}
            mockStates={scenario.mockStates}
          />
        ))}
      </Grid>
    ),
    title: 'Support Card Scenarios',
    path: '/support-card',
  })
  .render();