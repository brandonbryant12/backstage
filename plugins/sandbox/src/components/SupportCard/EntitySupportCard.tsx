import React, { useEffect } from 'react';
import { CustomInfoCard } from "../CustomInfoCard/CustomInfoCard";
import { useEscalationGroupMembersQuery } from './hooks';

import Box from '@material-ui/core/Box';
import Grid from '@material-ui/core/Grid';
import Tabs from '@material-ui/core/Tabs';
import Tab from '@material-ui/core/Tab';
import { useState } from 'react';
import { ApplicationSupportInfo } from './ApplicationSupportInfo';
import { OnCallUser } from './OnCallUser';
import { IncidentGroupEmail } from './IncidentGroupEmail';
import { IncidentGroupMembers } from './IncidentGroupMembers';
import { Entity } from '@backstage/catalog-model';
import { useApplicationQuery } from './hooks';
import { useGroupQuery } from './hooks';
import { Progress } from '@backstage/core-components';


// From Image 1
export interface IncidentGroup {
    groupId: string;
    type: "primary" | "secondary" | "infra" | "nonprod" | "app";
    typeVal: string;
    details: Group;
  }
  
  export interface ApplicationSupportGroup {
    groupId: string;
    type: "primary" | "secondary" | "infra" | "nonprod" | "app";
    typeVal: string;
  }
  
  // From Image 2
  export interface Group {
    id: string;
    managerEmail: string;
    managerName: string;
    manager: string;
    name: string;
    description: string;
    email: string;
  }
  
  // From Image 3

  export interface EscalationGroupMember {
    userName: string;
    id: string;
    corpId: string;
    firstName: string;
    lastName: string;
    numberOfReminders: number;
    timeBetweenReminders: number;
    order: number;
    email: string;
  }
  
  // From Image 4
  export interface ApplicationInfo {
    rbfGovernedRating: string;
    productId: string;
    itProductManager: string;
    appId: string;
    description: string;
    productName: string;
    secondaryIncidentGroups: string;
    productLineDescription: string;
    primaryIncidentGroups: string;
    productLineDisplayName: string;
    businessProductManager: string;
    securityLevel: string;
    productLineName: string;
    appDisplayName: string;
    appDevManager: string;
    productDescription: string;
    appName: string;
    criticalityCode: string;
    infraAndAppApprovalGroups: string;
    nonProdApprovalGroups: string;
    appOnlyApprovalGroups: string;
  }


const GroupSupportInfo = ({ incidentGroups }: { incidentGroups: IncidentGroup[] }) => {
  const [selectedTabIndex, setSelectedTabIndex] = useState(0);
  const [selectedIncidentGroup, setSelectedIncidentGroup] = useState<IncidentGroup | undefined>();
  const { data: escalationGroupMembers, loading, error } = useEscalationGroupMembersQuery(
    selectedIncidentGroup?.details.name || ''
  );
  
  useEffect(() => {
    if (incidentGroups?.length > 0) {
      setSelectedIncidentGroup(incidentGroups[0]);
    }
  }, [incidentGroups]);

  const handleTabChange = (_: React.ChangeEvent<{}>, newValue: number) => {
    setSelectedTabIndex(newValue);
    setSelectedIncidentGroup(incidentGroups[newValue]);
  };

  if (!selectedIncidentGroup || !escalationGroupMembers) {
    return null;
  }

  return (
    <>
      <Tabs
        value={selectedTabIndex}
        onChange={handleTabChange}
        indicatorColor="primary"
        textColor="primary"
      >
        {incidentGroups.map((group, index) => (
          <Tab key={group.groupId} label={group.details.name} />
        ))}
      </Tabs>
      <Grid container spacing={3}>
        <Grid item xs={4}>
          <OnCallUser 
            escalationGroupMember={escalationGroupMembers.length > 0 ? escalationGroupMembers[0] : undefined} 
          />
        </Grid>
        <Grid item xs={4}>
          <IncidentGroupEmail escalationGroup={selectedIncidentGroup} />
        </Grid>
        <Grid item xs={4}>
          <IncidentGroupMembers 
            escalationGroup={selectedIncidentGroup} 
            escalationGroupMembers={escalationGroupMembers} 
          />
        </Grid>
      </Grid>
    </>
  );
};

interface SupportCardProps {
  entity: Entity;
  mockStates?: {
    application?: string;
    groups?: string;
    members?: string;
  };
}

const SupportCard = ({
  entity,
  mockStates = {},
}: SupportCardProps) => {
  const { data: application, loading: appLoading, error: appError } = 
    useApplicationQuery(entity, mockStates.application);
  const { data: incidentGroups = [], loading: groupsLoading, error: groupsError } = 
    useGroupQuery(application, mockStates.groups);
  
  if(appLoading || groupsLoading) {
    return <Progress/>
  }

  if(!application) {
    return <div>Error</div>
  }

  return (
    <CustomInfoCard
      title="Support"
      dataSources={[{
        name: 'ServiceNow',
        source: "https://placeholder"
      }]}
    >
      <Box>
        <Box mb={4}>
          <ApplicationSupportInfo 
            applicationInfo={application}
            supportInfo={entity.metadata?.annotations?.Support || 'support free test'}
          />
        </Box>
      </Box>
      <GroupSupportInfo incidentGroups={incidentGroups}/>
    </CustomInfoCard>
  )
};

export default SupportCard;




