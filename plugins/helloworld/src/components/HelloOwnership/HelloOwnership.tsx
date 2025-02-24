import React from 'react';
import { ConditionalOwnership } from 'common-components';

export const HelloOwnership = () => {
  return (
    <ConditionalOwnership
      ownerContent={<div>Hello Owner</div>}
      nonOwnerContent={<div>Hello Non-Owner</div>}
    />
  );
};