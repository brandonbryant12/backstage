import React from 'react';
import { ComponentMeta, ComponentStory } from '@storybook/react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { MemoryRouter } from 'react-router-dom';
import Button from '@mui/material/Button';
import Box from '@mui/material/Box';
import { CustomInfoCard } from './CustomInfoCard';
import { SkimStats } from '../SkimMetrics/SkimStats';

export default {
  title: 'Common/CustomInfoCard',
  component: CustomInfoCard,
  decorators: [
    story => (
      <MemoryRouter>
        <ThemeProvider theme={createTheme()}>
          {story()}
        </ThemeProvider>
      </MemoryRouter>
    ),
  ],
} as ComponentMeta<typeof CustomInfoCard>;

const Template: ComponentStory<typeof CustomInfoCard> = args => <CustomInfoCard {...args} />;

export const Default = Template.bind({});
Default.args = {
  title: 'Service Performance Stats',
  subheader: 'Real-time metrics and insights',
  dataSources: ['Prometheus', 'Grafana'],
  skimContent: (
    <SkimStats
      metrics={[
        { label: 'Uptime', value: '99.9%' },
        { label: 'Errors', value: '0.1%' },
      ]}
    />
  ),
  footerButtonsComponent: (
    <Box sx={{ display: 'flex', gap: 1 }}>
      <Button variant="outlined" size="small">View</Button>
      <Button variant="contained" size="small">Refresh</Button>
    </Box>
  ),
  children: <div>Expandable card body content goes here.</div>,
};

export const WithError = Template.bind({});
WithError.args = {
  ...Default.args,
  skimContent: (
    <SkimStats
      metrics={[
        { label: 'Uptime', isError: true },
        { label: 'Errors', value: '0.1%' },
      ]}
    />
  ),
};

export const WithNA = Template.bind({});
WithNA.args = {
  ...Default.args,
  skimContent: (
    <SkimStats
      metrics={[
        { label: 'Uptime' },
        { label: 'Errors', value: '0.1%' },
      ]}
    />
  ),
};

export const MixedStates = Template.bind({});
MixedStates.args = {
  ...Default.args,
  skimContent: (
    <SkimStats
      metrics={[
        { label: 'Uptime', isError: true },
        { label: 'Errors' },
        { label: 'Latency', value: '24 ms' },
      ]}
    />
  ),
};

export const WithErrorIcon = Template.bind({});
WithErrorIcon.args = {
  ...Default.args,
  errorMessage: 'Critical error occurred',
};

export const WithWarningIcon = Template.bind({});
WithWarningIcon.args = {
  ...Default.args,
  warningMessage: 'Potential issue detected',
};