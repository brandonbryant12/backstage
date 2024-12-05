import React from 'react';
import { IncidentGroup } from './SupportCard';

interface Props {
  escalationGroup: IncidentGroup;
}

export const OnCallContent: React.FC<Props> = ({ escalationGroup }) => {
  return (
    <div>
      <h4>On Call</h4>
      <p>{escalationGroup.details.name}</p>
    </div>
  );
}; 