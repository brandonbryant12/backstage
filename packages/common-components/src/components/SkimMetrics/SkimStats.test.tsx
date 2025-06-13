import React from 'react';
import { render, screen } from '@testing-library/react';
import { SkimStats } from './SkimStats';

describe('SkimStats', () => {
  it('renders all metric values provided', () => {
    render(<SkimStats metrics={[{ label: 'A', value: '1' }, { label: 'B', value: '2' }]} />);
    expect(screen.getByText('A')).toBeInTheDocument();
    expect(screen.getByText('1')).toBeInTheDocument();
    expect(screen.getByText('B')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
  });
});