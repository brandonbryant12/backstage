import React from 'react';
import { render, screen } from '@testing-library/react';
import { SkimStats } from './SkimStats';

describe('SkimStats', () => {
  it('renders metrics with values, errors, and N/A', () => {
    render(
      <SkimStats
        metrics={[
          { label: 'A', value: '1' },
          { label: 'B', isError: true },
          { label: 'C' },
        ]}
      />
    );
    expect(screen.getByText('A')).toBeInTheDocument();
    expect(screen.getByText('1')).toBeInTheDocument();
    expect(screen.getByText('B')).toBeInTheDocument();
    expect(screen.getByText('Error!')).toBeInTheDocument();
    expect(screen.getByText('C')).toBeInTheDocument();
    expect(screen.getByText('N/A')).toBeInTheDocument();
  });
});