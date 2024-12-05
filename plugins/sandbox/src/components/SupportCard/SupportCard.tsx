import React from 'react';
import { CustomInfoCard } from "../CustomInfoCard/CustomInfoCard";
import { useEscalationGroupMembers } from './hooks';

import Box from '@material-ui/core/Box';
import Grid from '@material-ui/core/Grid';
import Tabs from '@material-ui/core/Tabs';
import Tab from '@material-ui/core/Tab';
import { useState } from 'react';
import { ApplicationSupportInfo } from './ApplicationSupportInfo';
import { OnCallContent } from './OnCallContent';
import { SelectedGroupInfo } from './SelectedGroupInfo';
import { GroupMembers } from './GroupMembers';


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

const SupportCard = ({
  applicationInfo,
  supportInfo,
  incidentGroups,
}: {
  applicationInfo: ApplicationInfo;
  supportInfo?: string;
  incidentGroups: IncidentGroup[];
}) => {
  const [selectedTabIndex, setSelectedTabIndex] = useState(0);
  const [selectedGroupName, setSelectedGroupName] = useState(incidentGroups[0].details.name);
  const { escalationGroupMembers, loading, error } = useEscalationGroupMembers(selectedGroupName);

  const handleTabChange = (event: React.ChangeEvent<{}>, newValue: number) => {
    setSelectedTabIndex(newValue);
    setSelectedGroupName(incidentGroups[newValue].details.name);
  };

  const renderGroupContent = (group: IncidentGroup) => {
    if (loading) return <div>Loading...</div>;
    if (error) return <div>Error loading group members</div>;

    return (
      <Grid container spacing={3}>
        <Grid item xs={4}>
          <OnCallContent escalationGroup={group} />
        </Grid>
        <Grid item xs={4}>
          <SelectedGroupInfo escalationGroup={group} />
        </Grid>
        <Grid item xs={4}>
          <GroupMembers escalationGroup={group} members={escalationGroupMembers} />
        </Grid>
      </Grid>
    );
  };

  return (
    <CustomInfoCard
      title="Support"
      dataSources={[{
        name: 'Service Now',
        source: 'https://placeholder'
      }]}
    >
      <Box>
        <Box mb={4}>
          <ApplicationSupportInfo 
            applicationInfo={applicationInfo}
            supportInfo={supportInfo}
          />
        </Box>
        
        {incidentGroups.length > 1 ? (
          <>
            <Tabs 
              value={selectedTabIndex} 
              onChange={handleTabChange}
            >
              {incidentGroups.map((group) => (
                <Tab 
                  key={group.groupId} 
                  label={group.type.toUpperCase()} 
                />
              ))}
            </Tabs>
            {renderGroupContent(incidentGroups[selectedTabIndex])}
          </>
        ) : (
          renderGroupContent(incidentGroups[0])
        )}
      </Box>
    </CustomInfoCard>
  );
};

export default SupportCard;