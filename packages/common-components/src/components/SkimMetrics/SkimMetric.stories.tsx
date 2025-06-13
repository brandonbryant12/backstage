import React from 'react';
import { ComponentMeta, ComponentStory } from '@storybook/react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { SkimMetric } from './SkimMetric';

export default {
  title: 'Common/SkimMetric',
  component: SkimMetric,
  decorators: [
    story => (
      <ThemeProvider theme={createTheme()}>
        {story()}
      </ThemeProvider>
    ),
  ],
} as ComponentMeta<typeof SkimMetric>;

const Template: ComponentStory<typeof SkimMetric> = args => <SkimMetric {...args} />;

export const LightMode = Template.bind({});
LightMode.args = {
  label: 'Users',
  value: '123',
};

export const DarkMode = Template.bind({});
DarkMode.args = {
  label: 'Users',
  value: '123',
};
DarkMode.decorators = [
  story => (
    <ThemeProvider theme={createTheme({ palette: { mode: 'dark' } })}>
      {story()}
    </ThemeProvider>
  ),
];