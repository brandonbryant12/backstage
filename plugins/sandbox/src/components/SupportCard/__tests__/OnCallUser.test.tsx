import React from 'react';
import { render, screen } from '@testing-library/react';
import { OnCallUser } from '../OnCallUser';
import { mockData } from './testUtils';

describe('OnCallUser', () => {
  it('renders on-call user information when provided', () => {
    render(<OnCallUser escalationGroupMember={mockData.escalationGroupMember} />);

    expect(screen.getByText('ON CALL USER')).toBeInTheDocument();
    expect(screen.getByText(`${mockData.escalationGroupMember.firstName} ${mockData.escalationGroupMember.lastName}`)).toBeInTheDocument();
    expect(screen.getByText(mockData.escalationGroupMember.email)).toBeInTheDocument();
  });

  it('shows no user message when no member is provided', () => {
    render(<OnCallUser escalationGroupMember={undefined} />);
    
    expect(screen.getByText('No on-call user found')).toBeInTheDocument();
  });
}); 