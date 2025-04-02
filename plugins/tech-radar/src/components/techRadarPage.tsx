import React from 'react';
import { RadarPage } from '@backstage-community/plugin-tech-radar';

/**
 * A component that renders the Tech Radar page.
 *
 * @public
 */
export const TechRadarPage = () => {
  // TODO: Make height and width configurable or responsive
  return <RadarPage height={1000} width={1600} />;
};
