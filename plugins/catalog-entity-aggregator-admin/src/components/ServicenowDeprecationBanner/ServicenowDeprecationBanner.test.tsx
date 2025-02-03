import React from 'react';
import { render, screen } from '@testing-library/react';
import { ServicenowDeprecationBanner } from './ServicenowDeprecationBanner';
import { useEntity } from '@backstage/plugin-catalog-react';
import { useApi } from '@backstage/core-plugin-api';
import { useLocation } from 'react-router-dom';

// Mock the necessary modules and components
jest.mock('@backstage/plugin-catalog-react', () => ({
  useEntity: jest.fn(),
}));

jest.mock('@backstage/core-plugin-api', () => {
  const actual = jest.requireActual('@backstage/core-plugin-api');
  return {
    ...actual,
    useApi: jest.fn(),
  };
});

jest.mock('react-router-dom', () => ({
  useLocation: jest.fn(),
}));

jest.mock('@backstage/core-components', () => ({
  Link: ({ to, children, ...props }: { to: string; children: React.ReactNode }) => (
    <a href={to} {...props}>
      {children}
    </a>
  ),
}));

describe('ServicenowDeprecationBanner', () => {
  const mockEntity = {
    metadata: { namespace: 'servicenow' },
  };

  const mockConfig = {
    // In your component, you call config.getBoolean('entityAggregator.provider.enabled')
    getBoolean: jest.fn(),
  };

  const mockLocation = {
    pathname: '/catalog/servicenow/component',
    search: '?filter=test',
  };

  beforeEach(() => {
    // Set up the mocks to return the test values
    (useEntity as jest.Mock).mockReturnValue({ entity: mockEntity });
    (useApi as jest.Mock).mockReturnValue(mockConfig);
    (useLocation as jest.Mock).mockReturnValue(mockLocation);
  });

  it('renders banner when conditions are met', () => {
    // Enable the config boolean so that the banner should render
    mockConfig.getBoolean.mockReturnValue(true);
    render(<ServicenowDeprecationBanner />);

    expect(screen.getByTestId('servicenow-deprecation-banner')).toBeInTheDocument();
    expect(screen.getByText(/servicenow namespace deprecated/)).toBeInTheDocument();
  });

  it('does not render when config is disabled', () => {
    mockConfig.getBoolean.mockReturnValue(false);
    render(<ServicenowDeprecationBanner />);
    
    expect(screen.queryByTestId('servicenow-deprecation-banner')).not.toBeInTheDocument();
  });

  it('does not render for non-servicenow namespace', () => {
    // Change the entity namespace to something else
    (useEntity as jest.Mock).mockReturnValue({ 
      entity: { metadata: { namespace: 'default' } }
    });
    mockConfig.getBoolean.mockReturnValue(true);
    render(<ServicenowDeprecationBanner />);
    
    expect(screen.queryByTestId('servicenow-deprecation-banner')).not.toBeInTheDocument();
  });
});
