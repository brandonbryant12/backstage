import React from 'react';
import { Meta, StoryObj } from '@storybook/react';
import { CustomInfoCard } from './CustomInfoCard';
import { Typography, Box, List, ListItem, ListItemText } from '@material-ui/core';

const meta: Meta<typeof CustomInfoCard> = {
  title: 'Roadie/Components/CustomInfoCard',
  component: CustomInfoCard,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
    componentSubtitle: 'A customizable card component for displaying information with optional data sources and menu actions',
  },
};

export default meta;
type Story = StoryObj<typeof CustomInfoCard>;

// Example content components
const SimpleContent = () => (
  <Box p={2}>
    <Typography variant="body1">
      This is an example content for the card. It can contain any React components.
    </Typography>
  </Box>
);

const RichContent = () => (
  <Box p={2}>
    <Typography variant="body1" gutterBottom>
      This card demonstrates rich content with multiple elements:
    </Typography>
    <List>
      <ListItem>
        <ListItemText 
          primary="Custom Formatting" 
          secondary="The card supports various typography styles and layouts"
        />
      </ListItem>
      <ListItem>
        <ListItemText 
          primary="Flexible Content" 
          secondary="You can include any React components as children"
        />
      </ListItem>
      <ListItem>
        <ListItemText 
          primary="Interactive Elements" 
          secondary="Supports buttons, links, and other interactive components"
        />
      </ListItem>
    </List>
  </Box>
);

// Basic Examples
export const Basic: Story = {
  args: {
    title: 'Basic Card',
    children: <SimpleContent />,
  },
};

export const WithSubheader: Story = {
  args: {
    title: 'Card with Subheader',
    subheader: 'This is a subheader',
    children: <SimpleContent />,
  },
};

// Data Source Examples
export const WithSingleDataSource: Story = {
  args: {
    title: 'Single Data Source',
    children: <SimpleContent />,
    dataSources: [
      { source: 'https://example.com', name: 'Example' },
    ],
  },
};

export const WithMultipleDataSources: Story = {
  args: {
    title: 'Multiple Data Sources',
    children: <SimpleContent />,
    dataSources: [
      { source: 'https://example1.com', name: 'Source 1' },
      { source: 'https://example2.com', name: 'Source 2' },
      { source: 'https://example3.com', name: 'Source 3' },
    ],
  },
};

// Menu Action Examples
export const WithMenuActions: Story = {
  args: {
    title: 'Card with Menu Actions',
    children: <SimpleContent />,
    menuActions: [
      { label: 'Edit', onClick: () => console.log('Edit clicked') },
      { label: 'Delete', onClick: () => console.log('Delete clicked') },
      { label: 'Share', onClick: () => console.log('Share clicked') },
    ],
  },
};

// Theme Examples
export const DarkTheme: Story = {
  args: {
    title: 'Dark Theme Example',
    subheader: 'Demonstrates dark theme styling',
    children: <SimpleContent />,
    dataSources: [
      { source: 'https://example.com', name: 'Example' },
    ],
    menuActions: [
      { label: 'Edit', onClick: () => console.log('Edit clicked') },
    ],
  },
  parameters: {
    backgrounds: { default: 'dark' },
    theme: 'dark',
  },
};

// Complex Examples
export const WithRichContent: Story = {
  args: {
    title: 'Rich Content Example',
    subheader: 'Demonstrating complex content layout',
    children: <RichContent />,
    dataSources: [
      { source: 'https://docs.example.com', name: 'Documentation' },
    ],
    menuActions: [
      { label: 'Edit', onClick: () => console.log('Edit clicked') },
      { label: 'Share', onClick: () => console.log('Share clicked') },
    ],
  },
};

export const FullExample: Story = {
  args: {
    title: 'Complete Example',
    subheader: 'With all features enabled',
    children: <RichContent />,
    dataSources: [
      { source: 'https://example1.com', name: 'Primary Source' },
      { source: 'https://example2.com', name: 'Secondary Source' },
      { source: 'https://example3.com', name: 'Reference' },
    ],
    menuActions: [
      { label: 'Edit', onClick: () => console.log('Edit clicked') },
      { label: 'Share', onClick: () => console.log('Share clicked') },
      { label: 'Delete', onClick: () => console.log('Delete clicked') },
    ],
  },
};

// Different Sizes
export const CompactCard: Story = {
  args: {
    title: 'Compact Card',
    subheader: 'Minimal content example',
    children: (
      <Box p={1}>
        <Typography variant="body2">
          A brief message or status update.
        </Typography>
      </Box>
    ),
  },
};

export const LargeCard: Story = {
  args: {
    title: 'Large Card',
    subheader: 'Extended content example',
    children: (
      <Box p={2}>
        <Typography variant="h6" gutterBottom>
          Main Section
        </Typography>
        <Typography variant="body1" paragraph>
          Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod 
          tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam.
        </Typography>
        <Typography variant="h6" gutterBottom>
          Additional Information
        </Typography>
        <Typography variant="body1">
          Quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo 
          consequat. Duis aute irure dolor in reprehenderit.
        </Typography>
      </Box>
    ),
    dataSources: [
      { source: 'https://example.com', name: 'Learn More' },
    ],
  },
};