import React from 'react';
import { render, screen } from '@testing-library/react';
import { IncidentGroupEmail } from '../IncidentGroupEmail';
import { IncidentGroup } from '../EntitySupportCard';

const mockIncidentGroup: IncidentGroup = {
  groupId: 'group1',
  type: 'primary',
  typeVal: 'Primary Support',
  details: {
    id: '1',
    managerEmail: 'manager@company.com',
    managerName: 'Test Manager',
    manager: 'Test Manager',
    name: 'Test Group',
    description: 'Test Description',
    email: 'group@company.com',
  },
};

describe('IncidentGroupEmail', () => {
  it('renders group owner and email information', () => {
    render(<IncidentGroupEmail escalationGroup={mockIncidentGroup} />);

    expect(screen.getByText('GROUP OWNER')).toBeInTheDocument();
    expect(screen.getByText(mockIncidentGroup.details.managerName)).toBeInTheDocument();
    expect(screen.getByText('GROUP EMAIL')).toBeInTheDocument();
    expect(screen.getByText(mockIncidentGroup.details.email)).toBeInTheDocument();
  });
}); 