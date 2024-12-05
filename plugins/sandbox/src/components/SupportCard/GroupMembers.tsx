import React from 'react';
import { IncidentGroup, EscalationGroupMember } from './SupportCard';

interface Props {
  escalationGroup: IncidentGroup;
  members: EscalationGroupMember[];
}

export const GroupMembers: React.FC<Props> = ({ escalationGroup, members }) => {
  return (
    <div>
      <h4>Group Members</h4>
      {members.map(member => (
        <div key={member.id}>
          <p>{member.firstName} {member.lastName}</p>
          <p>{member.email}</p>
        </div>
      ))}
    </div>
  );
}; 