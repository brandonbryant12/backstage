import React from 'react';
import { render, screen } from '@testing-library/react';
import { HelloOwnership } from './HelloOwnership';
import { useEntityAccessCheck } from 'common-components';

jest.mock('common-components', () => ({
  ...jest.requireActual('common-components'),
  useEntityAccessCheck: jest.fn(),
}));

describe('HelloOwnership', () => {
  it('renders owner content if hasAccess is true', () => {
    (useEntityAccessCheck as jest.Mock).mockReturnValue({ loading: false, hasAccess: true });
    render(<HelloOwnership />);
    expect(screen.getByText('Hello Owner')).toBeInTheDocument();
    expect(screen.queryByText('Hello Non-Owner')).toBeNull();
  });

  it('renders non owner content if hasAccess is false', () => {
    (useEntityAccessCheck as jest.Mock).mockReturnValue({ loading: false, hasAccess: false });
    render(<HelloOwnership />);
    expect(screen.queryByText('Hello Owner')).toBeNull();
    expect(screen.getByText('Hello Non-Owner')).toBeInTheDocument();
  });
});