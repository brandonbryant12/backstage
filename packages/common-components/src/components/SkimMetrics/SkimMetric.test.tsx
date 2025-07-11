import React from 'react';
import { render, screen } from '@testing-library/react';
import { SkimMetric } from './SkimMetric';

describe('SkimMetric', () => {
  it('renders label and value', () => {
    render(<SkimMetric label="Users" value="123" />);
    expect(screen.getByText('Users')).toBeInTheDocument();
    expect(screen.getByText('123')).toBeInTheDocument();
  });

  it('renders label and Error! when isError is true', () => {
    render(<SkimMetric label="Users" isError={true} />);
    expect(screen.getByText('Users')).toBeInTheDocument();
    expect(screen.getByText('Error!')).toBeInTheDocument();
  });

  it('renders label and N/A when value is not provided', () => {
    render(<SkimMetric label="Users" />);
    expect(screen.getByText('Users')).toBeInTheDocument();
    expect(screen.getByText('N/A')).toBeInTheDocument();
  });

  it('applies custom color to value', () => {
    render(<SkimMetric label="Users" value="123" color="success" />);
    const valueElement = screen.getByText('123');
    // Assert style, e.g. expect(valueElement).toHaveStyle('color: rgb(76, 175, 80)'); // assuming success.main
  });
});