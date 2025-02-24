import React, { ReactNode } from 'react';
import { useEntityAccessCheck } from '../../hooks/useClientEntityAccessCheck/useEntityAccessCheck';

type ConditionalOwnershipProps = {
  ownerContent: ReactNode;
  nonOwnerContent: ReactNode;
};

export const ConditionalOwnership = ({
  ownerContent,
  nonOwnerContent,
}: ConditionalOwnershipProps) => {
  const { loading, hasAccess } = useEntityAccessCheck(['owner']);

  if (loading) {
    return <div>Loading...</div>;
  }

  return hasAccess ? <>{ownerContent}</> : <>{nonOwnerContent}</>;
};