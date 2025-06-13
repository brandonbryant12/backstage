import React from 'react';
import { render, screen } from '@testing-library/react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { SkimMetric } from './SkimMetric';

const renderWithTheme = (ui: React.ReactElement, mode: 'light' | 'dark' = 'light') =>
  render(
    <ThemeProvider theme={createTheme({ palette: { mode } })}>
      {ui}
    </ThemeProvider>
  );

describe('SkimMetric', () => {
it('renders label and value', () => {
renderWithTheme(<SkimMetric label="Users" value="123" />);
expect(screen.getByText('Users')).toBeInTheDocument();
expect(screen.getByText('123')).toBeInTheDocument();
});

it('applies dark‑mode background', () => {
const { container } = renderWithTheme(<SkimMetric label="CPU" value="80%" />, 'dark');
const box = container.firstChild as HTMLElement;
// mui grey\[800] = rgb(66,66,66)
expect(box).toHaveStyle(`background-color: rgb(66, 66, 66)`);
});
});
