import React from 'react';
import { screen, within } from '@testing-library/react';
import { renderInTestApp } from '@backstage/test-utils';
import SupportCard from '../EntitySupportCard';
import { Entity } from '@backstage/catalog-model';

const mockEntity: Entity = {
  apiVersion: 'backstage.io/v1alpha1',
  kind: 'Component',
  metadata: {
    name: 'test-service',
    annotations: {
      'Support': '# Test Support\nThis is a test support document',
    },
  },
  spec: {},
};

describe('SupportCard', () => {
  describe('basic rendering', () => {
    it('renders application info section', async () => {
      await renderInTestApp(<SupportCard entity={mockEntity} />);
  
      expect(screen.getByText('Support')).toBeInTheDocument();
      expect(screen.getByText('APP ID')).toBeInTheDocument();
      expect(screen.getByText('APP123')).toBeInTheDocument();
      expect(screen.getByText('MANAGERS')).toBeInTheDocument();
    });

    it('shows error state when application fetch fails', async () => {
      await renderInTestApp(
        <SupportCard 
          entity={mockEntity} 
          mockStates={{ application: 'error' }}
        />
      );
  
      expect(screen.getByText('Error')).toBeInTheDocument();
    });
  });

  describe('incident group display', () => {
    it('displays group email information', async () => {
      await renderInTestApp(<SupportCard entity={mockEntity} />);
  
      expect(screen.getByText('GROUP OWNER')).toBeInTheDocument();
      expect(screen.getByText('Test Manager')).toBeInTheDocument();
      expect(screen.getByText('GROUP EMAIL')).toBeInTheDocument();
      expect(screen.getByText('group@company.com')).toBeInTheDocument();
    });

    it('displays on-call user information', async () => {
      await renderInTestApp(<SupportCard entity={mockEntity} />);
  
      expect(screen.getByText('ON CALL USER')).toBeInTheDocument();
      expect(screen.getByText('Test User')).toBeInTheDocument();
      expect(screen.getByText('test.user@company.com')).toBeInTheDocument();
    });

    it('handles multiple incident groups', async () => {
      await renderInTestApp(
        <SupportCard 
          entity={mockEntity} 
          mockStates={{ groups: 'extended' }}
        />
      );
  
      expect(screen.getByText('Extended Support Group 0')).toBeInTheDocument();
      expect(screen.getByText('Extended Support Group 1')).toBeInTheDocument();
    });
  
    it('handles empty incident groups', async () => {
      await renderInTestApp(
        <SupportCard 
          entity={mockEntity} 
          mockStates={{ groups: 'empty' }}
        />
      );
  
      expect(screen.getByText('No support groups found')).toBeInTheDocument();
    });
  });

  describe('tab behavior', () => {
    it('shows tabs when multiple incident groups exist', async () => {
      await renderInTestApp(
        <SupportCard 
          entity={mockEntity} 
          mockStates={{ groups: 'extended' }}
        />
      );

      const tabs = screen.getByRole('tablist');
      expect(tabs).toBeInTheDocument();
      
      const tabButtons = within(tabs).getAllByRole('tab');
      expect(tabButtons).toHaveLength(10); // Extended mock has 10 groups
      
      expect(screen.getByText('Extended Support Group 0')).toBeInTheDocument();
      expect(screen.getByText('Extended Support Group 1')).toBeInTheDocument();
    });

    it('does not show tabs when only one incident group exists', async () => {
      await renderInTestApp(
        <SupportCard 
          entity={mockEntity} 
          mockStates={{ groups: 'single' }}
        />
      );

      expect(screen.queryByRole('tablist')).not.toBeInTheDocument();
      expect(screen.getByText('Primary Support Group')).toBeInTheDocument();
    });

    it('does not show tabs when no incident groups exist', async () => {
      await renderInTestApp(
        <SupportCard 
          entity={mockEntity} 
          mockStates={{ groups: 'empty' }}
        />
      );

      expect(screen.queryByRole('tablist')).not.toBeInTheDocument();
      expect(screen.getByText('No support groups found')).toBeInTheDocument();
    });
  });

  describe('markdown support', () => {
    it('renders support information in markdown', async () => {
      await renderInTestApp(<SupportCard entity={mockEntity} />);
      
      expect(screen.getByText('Test Support')).toBeInTheDocument();
      expect(screen.getByText('This is a test support document')).toBeInTheDocument();
    });
  });
}); 