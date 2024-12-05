import { useState, useEffect } from 'react';
import { EscalationGroupMember } from './SupportCard';

// Mock data
const mockMembers: EscalationGroupMember[] = [
  {
    userName: 'jsmith',
    id: '1',
    corpId: 'JS1234',
    firstName: 'John',
    lastName: 'Smith',
    numberOfReminders: 3,
    timeBetweenReminders: 5,
    order: 1,
    email: 'john.smith@company.com'
  },
  {
    userName: 'mjohnson',
    id: '2',
    corpId: 'MJ5678',
    firstName: 'Mary',
    lastName: 'Johnson',
    numberOfReminders: 3,
    timeBetweenReminders: 5,
    order: 2,
    email: 'mary.johnson@company.com'
  },
  {
    userName: 'rthomas',
    id: '3',
    corpId: 'RT9012',
    firstName: 'Robert',
    lastName: 'Thomas',
    numberOfReminders: 3,
    timeBetweenReminders: 5,
    order: 3,
    email: 'robert.thomas@company.com'
  }
];

export const useEscalationGroupMembers = (groupName: string) => {
  // const [loading, setLoading] = useState(true);
  // const [error, setError] = useState<Error | null>(null);
  // const [escalationGroupMembers, setEscalationGroupMembers] = useState<EscalationGroupMember[]>([]);

  // useEffect(() => {
  //   // TODO: Implement actual API call
  //   setLoading(false);
  //   setEscalationGroupMembers([]);
  // }, [groupName]);

  // Mock implementation
  return { 
    escalationGroupMembers: mockMembers, 
    loading: false, 
    error: null 
  };
}; 