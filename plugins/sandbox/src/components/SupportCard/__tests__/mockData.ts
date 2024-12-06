import { Entity } from '@backstage/catalog-model';
import { IncidentGroup, EscalationGroupMember, ApplicationInfo } from '../EntitySupportCard';

export const mockEntity: Entity = {
  apiVersion: 'backstage.io/v1alpha1',
  kind: 'Component',
  metadata: {
    name: 'test-service',
    annotations: {
      'Support': '# Test Support\nThis is a test support document',
    },
  },
  spec: {},
};

export const mockIncidentGroup: IncidentGroup = {
  groupId: 'group1',
  type: 'primary',
  typeVal: 'Primary Support',
  details: {
    id: '1',
    managerEmail: 'manager@company.com',
    managerName: 'Test Manager',
    manager: 'Test Manager',
    name: 'Test Group',
    description: 'Test Description',
    email: 'group@company.com',
  },
};

export const mockEscalationGroupMember: EscalationGroupMember = {
  userName: 'testuser',
  id: '1',
  corpId: 'TEST123',
  firstName: 'Test',
  lastName: 'User',
  numberOfReminders: 3,
  timeBetweenReminders: 15,
  order: 1,
  email: 'test.user@company.com',
};

export const mockApplicationInfo: ApplicationInfo = {
  rbfGovernedRating: 'High',
  productId: 'PROD123',
  itProductManager: 'Test Manager',
  appId: 'APP123',
  description: 'Test App',
  productName: 'Test Product',
  secondaryIncidentGroups: 'group2',
  productLineDescription: 'Test Line',
  primaryIncidentGroups: 'group1',
  productLineDisplayName: 'Test Line',
  businessProductManager: 'Test BPM',
  securityLevel: 'High',
  productLineName: 'TestLine',
  appDisplayName: 'Test App',
  appDevManager: 'Test Dev',
  productDescription: 'Test Product',
  appName: 'TestApp',
  criticalityCode: '1',
  infraAndAppApprovalGroups: 'infra1',
  nonProdApprovalGroups: 'nonprod1',
  appOnlyApprovalGroups: 'app1',
}; 