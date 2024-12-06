import React from 'react';
import { createDevApp } from '@backstage/dev-utils';
import { EntityProvider } from '@backstage/plugin-catalog-react';
import { sandboxPlugin } from '../src/plugin';
import SupportCard from '../src/components/SupportCard/EntitySupportCard';
import Grid from '@material-ui/core/Grid';
import Typography from '@material-ui/core/Typography';
import { Entity } from '@backstage/catalog-model';

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

// Add this after createMockEntity and before ScenarioWrapper
const createLargeDataMockEntity = () => {
  const entity = createMockEntity({
    'Support': `
# Comprehensive Support Documentation

## Service Overview
This critical enterprise service requires 24/7 support coverage across multiple regions. The system handles mission-critical transactions and requires immediate response for any production incidents.

## Primary Support Team
* **Team Name:** Global Enterprise Support
* **Coverage Hours:** 24/7/365
* **Response Time:** 15 minutes or less
* **Escalation Path:** Follow standard P1 process
* **War Room Link:** [Click Here](https://teams.microsoft.com/warroom)

## Regional Support Coverage
### AMERICAS
* Primary: Enterprise Support Team
* Hours: 9am-5pm EST
* On-Call: John Smith
* Backup: Sarah Johnson

### EMEA
* Primary: European Operations
* Hours: 9am-5pm CET
* On-Call: Hans Mueller
* Backup: Marie Dubois

### APAC
* Primary: APAC Support Team
* Hours: 9am-5pm SGT
* On-Call: Li Wei
* Backup: Raj Patel

## Incident Management Process
1. First responder acknowledges in ServiceNow
2. Assess severity using standard matrix
3. Engage required SMEs
4. Update status every 30 minutes
5. Post-incident review for all P1/P2

## Key Contacts
### Product Team
* Product Owner: Alice Thompson
* Tech Lead: Bob Wilson
* Architect: Carol Martinez

### Infrastructure Team
* Cloud Platform: Dave Johnson
* Network: Eve Anderson
* Security: Frank Miller

## Compliance Requirements
* SOX Compliance Level: High
* PCI DSS: In Scope
* GDPR: Handles PII
* Data Classification: Restricted

## Runbooks
* [Deployment Process](https://wiki/deployment)
* [Database Failover](https://wiki/db-failover)
* [DR Procedures](https://wiki/disaster-recovery)
* [Security Incident](https://wiki/security)

## Additional Resources
* [Architecture Diagram](https://wiki/architecture)
* [Service Dependencies](https://wiki/dependencies)
* [SLA Documentation](https://wiki/sla)
* [Change Management](https://wiki/change)

> **Note:** All team members must acknowledge reading this document and complete required training before participating in on-call rotation.
    `,
    'backstage.io/extended-info': 'true',
  });

  return {
    entity,
    mockStates: {
      application: 'extended',
      groups: 'extended',
      members: 'extended',
    },
  };
};

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
  {
    title: 'Extended Data View',
    ...createLargeDataMockEntity(),
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