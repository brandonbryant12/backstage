import React from 'react';
import { IncidentGroup } from './EntitySupportCard';

interface IncidentGroupEmailProps {
  escalationGroup: IncidentGroup;
}

export const IncidentGroupEmail = ({ escalationGroup }: IncidentGroupEmailProps) => {
  return (
    <div>
      <h3>Group Contact</h3>
      <div>Email: {escalationGroup.details.email}</div>
      <div>Manager: {escalationGroup.details.managerName}</div>
      <div>Manager Email: {escalationGroup.details.managerEmail}</div>
    </div>
  );
}; 