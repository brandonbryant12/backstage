import React from 'react';
import { render, screen } from '@testing-library/react';
import { ResilienceCard } from './ResilienceCard';

jest.mock('common-components', () => ({
  CustomInfoCard: ({ title, children, skimContent }: any) => (
    <div>
      <h2>{title}</h2>
      <div data-testid="skim-content">{skimContent}</div>
      <div data-testid="card-content">{children}</div>
    </div>
  ),
}));

describe('ResilienceCard', () => {
  it('renders the resilience card with correct title', () => {
    render(<ResilienceCard />);
    expect(screen.getByText('Resilience')).toBeInTheDocument();
  });

  it('displays chaos experiment compliance status', () => {
    render(<ResilienceCard />);
    expect(screen.getByText('Yes')).toBeInTheDocument();
    expect(screen.getByText('Chaos Experiment Compliant')).toBeInTheDocument();
  });

  it('displays incident counts', () => {
    render(<ResilienceCard />);
    expect(screen.getByText('1')).toBeInTheDocument(); // Critical
    expect(screen.getByText('3')).toBeInTheDocument(); // High/Medium
    expect(screen.getByText('10')).toBeInTheDocument(); // Low
  });

  it('displays chaos experiment details in expanded content', () => {
    render(<ResilienceCard />);
    expect(screen.getByText(/Chaos Experiments Compliant: Yes/)).toBeInTheDocument();
    expect(screen.getByText(/In Scope: No/)).toBeInTheDocument();
    expect(screen.getByText(/Catchup Date: May 20, 2024/)).toBeInTheDocument();
  });
});