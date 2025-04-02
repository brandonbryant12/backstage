import React from 'react';
import { renderInTestApp, TestApiProvider } from '@backstage/test-utils';
import { TechRadarPage } from './techRadarPage';
import { techRadarApiRef } from '@backstage-community/plugin-tech-radar';
import { mockApiClient } from '../api/mockClient'; // Adjust the path as necessary

describe('TechRadarPage', () => {
  // Mock getBBox for SVGTextElement which is not implemented in JSDOM
  beforeAll(() => {
    // @ts-ignore
    SVGElement.prototype.getBBox = () => ({
      x: 0,
      y: 0,
      width: 0,
      height: 0,
    });
  });

  it('should render', async () => {
    const { findByText } = await renderInTestApp(
      <TestApiProvider apis={[[techRadarApiRef, mockApiClient]]}>
        <TechRadarPage />
      </TestApiProvider>,
    );

    // Wait for one of the quadrant names to appear, indicating the radar has loaded data
    expect(await findByText('Patterns')).toBeInTheDocument();
    expect(await findByText('Guidelines')).toBeInTheDocument();
    // You could add more assertions here, e.g., checking for specific entries or rings
  });
});
