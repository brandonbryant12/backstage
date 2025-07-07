import React, { useEffect } from 'react';
import { DeepDivePage } from 'common-components';
import { useEntity } from '@backstage/plugin-catalog-react';

function TechRadarContent() {
  const { entity } = useEntity();
  useEffect(() => {
    // eslint-disable-next-line no-console
    console.log('Entity:', entity);
  }, [entity]);

  return <div>Hello&nbsp;World</div>;
}

export const EntityTechRadarDeepDivePage = () => (
  <DeepDivePage subtitle="Tech Radar - Deep Dive">
    <TechRadarContent />
  </DeepDivePage>
);