import React from 'react';
import { render, screen, within } from '@testing-library/react';
import userEvent from 'directive:add-import:devDependencies:@testing-library/user-event';
import { CustomInfoCard } from './CustomInfoCard';

describe('CustomInfoCard', () => {
  const mockDataSources = [
    { source: 'https://example1.com', name: 'Source 1' },
    { source: 'https://example2.com', name: 'Source 2' },
  ];

  const mockMenuActions = [
    { label: 'Edit', onClick: jest.fn() },
    { label: 'Delete', onClick: jest.fn() },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders basic card with title and content', () => {
    render(
      <CustomInfoCard title="Test Title">
        <div>Test Content</div>
      </CustomInfoCard>
    );

    expect(screen.getByText('Test Title')).toBeInTheDocument();
    expect(screen.getByText('Test Content')).toBeInTheDocument();
  });

  it('renders subheader when provided', () => {
    render(
      <CustomInfoCard 
        title="Test Title" 
        subheader="Test Subheader"
      >
        <div>Content</div>
      </CustomInfoCard>
    );

    expect(screen.getByText('Test Subheader')).toBeInTheDocument();
  });

  describe('Data Sources', () => {
    it('renders single data source as a "GO TO" button', () => {
      const singleSource = [{ source: 'https://example.com', name: 'Example' }];
      
      render(
        <CustomInfoCard 
          title="Test" 
          dataSources={singleSource}
        >
          <div>Content</div>
        </CustomInfoCard>
      );

      const button = screen.getByRole('button', { name: /GO TO EXAMPLE/i });
      expect(button).toBeInTheDocument();
    });

    it('renders multiple data sources with separator', () => {
      render(
        <CustomInfoCard 
          title="Test" 
          dataSources={mockDataSources}
        >
          <div>Content</div>
        </CustomInfoCard>
      );

      const button = screen.getByRole('button', { name: /Source 1 \| Source 2/i });
      expect(button).toBeInTheDocument();
    });

    it('opens data source menu when clicked with multiple sources', async () => {
      render(
        <CustomInfoCard 
          title="Test" 
          dataSources={mockDataSources}
        >
          <div>Content</div>
        </CustomInfoCard>
      );

      const button = screen.getByRole('button', { name: /Source 1 \| Source 2/i });
      await userEvent.click(button);

      const menu = screen.getByRole('menu');
      expect(menu).toBeInTheDocument();
      expect(within(menu).getByText('Source 1')).toBeInTheDocument();
      expect(within(menu).getByText('Source 2')).toBeInTheDocument();
    });
  });

  describe('Menu Actions', () => {
    it('does not render menu icon when no actions provided', () => {
      render(
        <CustomInfoCard title="Test">
          <div>Content</div>
        </CustomInfoCard>
      );

      expect(screen.queryByLabelText('settings')).not.toBeInTheDocument();
    });

    it('renders menu icon when actions are provided', () => {
      render(
        <CustomInfoCard 
          title="Test"
          menuActions={mockMenuActions}
        >
          <div>Content</div>
        </CustomInfoCard>
      );

      expect(screen.getByLabelText('settings')).toBeInTheDocument();
    });

    it('opens menu with correct actions when clicked', async () => {
      render(
        <CustomInfoCard 
          title="Test"
          menuActions={mockMenuActions}
        >
          <div>Content</div>
        </CustomInfoCard>
      );

      const menuButton = screen.getByLabelText('settings');
      await userEvent.click(menuButton);

      const menu = screen.getByRole('menu');
      expect(menu).toBeInTheDocument();
      expect(within(menu).getByText('Edit')).toBeInTheDocument();
      expect(within(menu).getByText('Delete')).toBeInTheDocument();
    });

    it('calls the correct action when menu item is clicked', async () => {
      render(
        <CustomInfoCard 
          title="Test"
          menuActions={mockMenuActions}
        >
          <div>Content</div>
        </CustomInfoCard>
      );

      const menuButton = screen.getByLabelText('settings');
      await userEvent.click(menuButton);

      const editButton = screen.getByText('Edit');
      await userEvent.click(editButton);

      expect(mockMenuActions[0].onClick).toHaveBeenCalledTimes(1);
      expect(mockMenuActions[1].onClick).not.toHaveBeenCalled();
    });
  });

  describe('Window interactions', () => {
    let originalOpen: typeof window.open;

    beforeEach(() => {
      originalOpen = window.open;
      window.open = jest.fn();
    });

    afterEach(() => {
      window.open = originalOpen;
    });

    it('opens correct URL when single source button is clicked', async () => {
      const singleSource = [{ source: 'https://example.com', name: 'Example' }];
      
      render(
        <CustomInfoCard 
          title="Test" 
          dataSources={singleSource}
        >
          <div>Content</div>
        </CustomInfoCard>
      );

      const button = screen.getByRole('button', { name: /GO TO EXAMPLE/i });
      await userEvent.click(button);

      expect(window.open).toHaveBeenCalledWith('https://example.com', '_blank');
    });

    it('opens correct URL when source is selected from dropdown', async () => {
      render(
        <CustomInfoCard 
          title="Test" 
          dataSources={mockDataSources}
        >
          <div>Content</div>
        </CustomInfoCard>
      );

      const button = screen.getByRole('button', { name: /Source 1 \| Source 2/i });
      await userEvent.click(button);

      const firstSource = screen.getByText('Source 1');
      await userEvent.click(firstSource);

      expect(window.open).toHaveBeenCalledWith('https://example1.com', '_blank');
    });
  });
}); 