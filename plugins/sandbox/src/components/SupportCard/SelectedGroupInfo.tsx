import React from 'react';
import { IncidentGroup } from './SupportCard';

interface Props {
  escalationGroup: IncidentGroup;
}

export const SelectedGroupInfo: React.FC<Props> = ({ escalationGroup }) => {
  return (
    <div>
      <h4>Group Info</h4>
      <p>Manager: {escalationGroup.details.managerName}</p>
      <p>Email: {escalationGroup.details.email}</p>
    </div>
  );
}; 