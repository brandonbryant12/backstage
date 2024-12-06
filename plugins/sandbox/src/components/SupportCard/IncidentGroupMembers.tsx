import React from 'react';
import { IncidentGroup, EscalationGroupMember } from './EntitySupportCard';

interface IncidentGroupMembersProps {
  escalationGroup: IncidentGroup;
  escalationGroupMembers: EscalationGroupMember[];
}

export const IncidentGroupMembers = ({ 
  escalationGroup, 
  escalationGroupMembers 
}: IncidentGroupMembersProps) => {
  return (
    <div>
      <h3>Group Members</h3>
      {escalationGroupMembers.map(member => (
        <div key={member.id}>
          <div>{member.firstName} {member.lastName}</div>
          <div>{member.email}</div>
        </div>
      ))}
    </div>
  );
}; 