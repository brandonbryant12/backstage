import React from 'react';
import { render, screen } from '@testing-library/react';
import { ServicenowDeprecationBanner } from './ServicenowDeprecationBanner';
import { useEntity } from '@backstage/plugin-catalog-react';
import { useApi } from '@backstage/core-plugin-api';
import { useLocation } from 'react-router-dom';

jest.mock('@backstage/plugin-catalog-react');
jest.mock('@backstage/core-plugin-api');
jest.mock('react-router-dom');

describe('ServicenowDeprecationBanner', () => {
  const mockEntity = {
    metadata: { namespace: 'servicenow' }
  };

  const mockConfig = {
    getBoolean: jest.fn()
  };

  const mockLocation = {
    pathname: '/catalog/servicenow/component',
    search: '?filter=test'
  };

  beforeEach(() => {
    (useEntity as jest.Mock).mockReturnValue({ entity: mockEntity });
    (useApi as jest.Mock).mockReturnValue(mockConfig);
    (useLocation as jest.Mock).mockReturnValue(mockLocation);
  });

  it('renders banner when conditions are met', () => {
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
    (useEntity as jest.Mock).mockReturnValue({ 
      entity: { metadata: { namespace: 'default' } }
    });
    mockConfig.getBoolean.mockReturnValue(true);
    render(<ServicenowDeprecationBanner />);
    
    expect(screen.queryByTestId('servicenow-deprecation-banner')).not.toBeInTheDocument();
  });
});