import React from 'react';
import { render, screen } from '@testing-library/react';
import { CodeCoverageCard } from './CodeCoverageCard';

jest.mock('recharts', () => ({
  PieChart: ({ children }: any) => <div data-testid="pie-chart">{children}</div>,
  Pie: ({ children }: any) => <div data-testid="pie">{children}</div>,
  Cell: () => <div data-testid="cell" />,
  ResponsiveContainer: ({ children }: any) => <div data-testid="responsive-container">{children}</div>,
  Legend: () => <div data-testid="legend" />,
}));

jest.mock('common-components', () => ({
  CustomInfoCard: ({ title, children, dataSources }: any) => (
    <div data-testid="custom-info-card">
      <h1>{title}</h1>
      <div data-testid="data-sources">{dataSources?.join(', ')}</div>
      {children}
    </div>
  ),
}));

describe('CodeCoverageCard', () => {
  it('should render the card with correct title', () => {
    render(<CodeCoverageCard />);
    expect(screen.getByText('Code Coverage')).toBeInTheDocument();
  });

  it('should display the correct data sources', () => {
    render(<CodeCoverageCard />);
    expect(screen.getByTestId('data-sources')).toHaveTextContent('Jest, Coverage Reports');
  });

  it('should display the overall coverage percentage', () => {
    render(<CodeCoverageCard />);
    expect(screen.getByText('Overall Coverage: 78%')).toBeInTheDocument();
  });

  it('should render the pie chart', () => {
    render(<CodeCoverageCard />);
    expect(screen.getByTestId('pie-chart')).toBeInTheDocument();
    expect(screen.getByTestId('responsive-container')).toBeInTheDocument();
  });

  it('should display coverage breakdown section', () => {
    render(<CodeCoverageCard />);
    expect(screen.getByText('Coverage Breakdown')).toBeInTheDocument();
  });

  it('should display all coverage metrics', () => {
    render(<CodeCoverageCard />);
    
    expect(screen.getByText('Statements')).toBeInTheDocument();
    expect(screen.getByText('82.3%')).toBeInTheDocument();
    
    expect(screen.getByText('Branches')).toBeInTheDocument();
    expect(screen.getByText('75.5%')).toBeInTheDocument();
    
    expect(screen.getByText('Functions')).toBeInTheDocument();
    expect(screen.getByText('79.1%')).toBeInTheDocument();
    
    expect(screen.getByText('Lines')).toBeInTheDocument();
    expect(screen.getByText('78.0%')).toBeInTheDocument();
  });
});