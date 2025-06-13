import React from 'react';
import { ComponentMeta, ComponentStory } from '@storybook/react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { SkimStats } from './SkimStats';

export default {
  title: 'Common/SkimStats',
  component: SkimStats,
  decorators: [
    story => (
      <ThemeProvider theme={createTheme()}>
        {story()}
      </ThemeProvider>
    ),
  ],
} as ComponentMeta<typeof SkimStats>;

const Template: ComponentStory<typeof SkimStats> = args => <SkimStats {...args} />;

export const Default = Template.bind({});
Default.args = {
  metrics: [
    { label: 'Uptime', value: '99.9%' },
    { label: 'Errors', value: '0.1%' },
    { label: 'Latency', value: '24 ms' },
  ],
};