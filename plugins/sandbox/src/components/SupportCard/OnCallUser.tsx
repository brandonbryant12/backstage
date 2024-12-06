import React from 'react';
import { EscalationGroupMember } from './EntitySupportCard';

interface OnCallUserProps {
  escalationGroupMember?: EscalationGroupMember;
}

export const OnCallUser = ({ escalationGroupMember }: OnCallUserProps) => {
  if (!escalationGroupMember) {
    return <div>No on-call user found</div>;
  }

  return (
    <div>
      <h3>On Call User</h3>
      <div>{escalationGroupMember.firstName} {escalationGroupMember.lastName}</div>
      <div>{escalationGroupMember.email}</div>
    </div>
  );
}; 