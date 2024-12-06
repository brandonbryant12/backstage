import { Entity } from '@backstage/catalog-model';
import { ApplicationInfo, IncidentGroup, EscalationGroupMember } from './EntitySupportCard';

// Mock data for testing
const mockApplication: ApplicationInfo = {
  rbfGovernedRating: "High",
  productId: "PROD123",
  itProductManager: "John Doe",
  appId: "APP123",
  description: "Test Application",
  productName: "Test Product",
  secondaryIncidentGroups: "group2,group3",
  productLineDescription: "Test Product Line",
  primaryIncidentGroups: "group1",
  productLineDisplayName: "Test Product Line",
  businessProductManager: "Jane Smith",
  securityLevel: "High",
  productLineName: "TestLine",
  appDisplayName: "Test App",
  appDevManager: "Bob Wilson",
  productDescription: "Test Product Description",
  appName: "TestApp",
  criticalityCode: "1",
  infraAndAppApprovalGroups: "infra1,infra2",
  nonProdApprovalGroups: "nonprod1",
  appOnlyApprovalGroups: "app1",
};

const extendedMockApplication: ApplicationInfo = {
  ...mockApplication,
  description: "This is an extended description that goes into much more detail about the application's purpose, architecture, and business value. It might span multiple lines and contain various technical and business-related information.",
  productName: "Enterprise Product Suite",
  secondaryIncidentGroups: "group2,group3,group4,group5,group6",
  productLineDescription: "Enterprise Solutions Division",
  primaryIncidentGroups: "group1,group7,group8",
  businessProductManager: "Jane Smith (Global), John Doe (EMEA), Alice Johnson (APAC)",
  appDevManager: "Bob Wilson (Lead), Carol Brown (Deputy), David Lee (Associate)",
  productDescription: "Multi-regional enterprise solution with high availability requirements",
};

const mockIncidentGroups: IncidentGroup[] = [
  {
    groupId: "group1",
    type: "primary",
    typeVal: "Primary Support",
    details: {
      id: "1",
      managerEmail: "manager1@company.com",
      managerName: "Manager One",
      manager: "Manager One",
      name: "Primary Support Group",
      description: "Primary support team",
      email: "primary@company.com",
    },
  },
  {
    groupId: "group2",
    type: "secondary",
    typeVal: "Secondary Support",
    details: {
      id: "2",
      managerEmail: "manager2@company.com",
      managerName: "Manager Two",
      manager: "Manager Two",
      name: "Secondary Support Group",
      description: "Secondary support team",
      email: "secondary@company.com",
    },
  },
];

const mockEscalationGroupMembers: EscalationGroupMember[] = [
  {
    userName: "user1",
    id: "1",
    corpId: "corp1",
    firstName: "John",
    lastName: "Doe",
    numberOfReminders: 3,
    timeBetweenReminders: 15,
    order: 1,
    email: "john.doe@company.com",
  },
  {
    userName: "user2",
    id: "2",
    corpId: "corp2",
    firstName: "Jane",
    lastName: "Smith",
    numberOfReminders: 3,
    timeBetweenReminders: 15,
    order: 2,
    email: "jane.smith@company.com",
  },
];

interface QueryResponse<T> {
  data: T | undefined;
  loading: boolean;
  error: Error | null;
}

export const useApplicationQuery = (entity: Entity, mockState?: string): QueryResponse<ApplicationInfo> => {
  switch(mockState) {
    case 'loading':
      return { data: undefined, loading: true, error: null };
    case 'error':
      return { data: undefined, loading: false, error: new Error('Failed to fetch application') };
    case 'empty':
      return { data: undefined, loading: false, error: null };
    case 'extended':
      return { data: extendedMockApplication, loading: false, error: null };
    default:
      return { data: mockApplication, loading: false, error: null };
  }
};

export const useGroupQuery = (application?: ApplicationInfo, mockState?: string): QueryResponse<IncidentGroup[]> => {
  switch(mockState) {
    case 'loading':
      return { data: undefined, loading: true, error: null };
    case 'error':
      return { data: undefined, loading: false, error: new Error('Failed to fetch groups') };
    case 'empty':
      return { data: [], loading: false, error: null };
    case 'single':
      return { data: [mockIncidentGroups[0]], loading: false, error: null };
    case 'extended':
      return { 
        data: Array(10).fill(null).map((_, i) => ({
          groupId: `group${i}`,
          type: "primary",
          typeVal: `Support Group ${i}`,
          details: {
            id: `${i}`,
            managerEmail: `manager${i}@company.com`,
            managerName: `Manager ${i}`,
            manager: `Manager ${i}`,
            name: `Extended Support Group ${i}`,
            description: `Extended description for group ${i}`,
            email: `support${i}@company.com`,
          },
        })),
        loading: false, 
        error: null 
      };
    default:
      return { data: mockIncidentGroups, loading: false, error: null };
  }
};

export const useEscalationGroupMembersQuery = (groupName: string, mockState?: string): QueryResponse<EscalationGroupMember[]> => {
  switch(mockState) {
    case 'loading':
      return { data: undefined, loading: true, error: null };
    case 'error':
      return { data: undefined, loading: false, error: new Error('Failed to fetch members') };
    case 'empty':
      return { data: [], loading: false, error: null };
    case 'single':
      return { data: [mockEscalationGroupMembers[0]], loading: false, error: null };
    case 'extended':
      return { 
        data: Array(50).fill(null).map((_, i) => ({
          userName: `user${i}`,
          id: `${i}`,
          corpId: `corp${i}`,
          firstName: `${['John', 'Jane', 'Bob', 'Alice', 'Charlie', 'Diana'][i % 6]}`,
          lastName: `${['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia'][i % 6]} ${Math.floor(i/6) + 1}`,
          numberOfReminders: 3,
          timeBetweenReminders: 15,
          order: i + 1,
          email: `${['john', 'jane', 'bob', 'alice', 'charlie', 'diana'][i % 6]}.${['smith', 'johnson', 'williams', 'brown', 'jones', 'garcia'][i % 6]}${Math.floor(i/6) + 1}@company.com`,
        })),
        loading: false, 
        error: null 
      };
    default:
      return { data: mockEscalationGroupMembers, loading: false, error: null };
  }
}; 