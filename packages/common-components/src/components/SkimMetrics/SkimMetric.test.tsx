import React from 'react';
import { render, screen } from '@testing-library/react';
import { SkimMetric } from './SkimMetric';

describe('SkimMetric', () => {
  it('renders label and value', () => {
    render(<SkimMetric label="Users" value="123" />);
    expect(screen.getByText('Users')).toBeInTheDocument();
    expect(screen.getByText('123')).toBeInTheDocument();
  });
});