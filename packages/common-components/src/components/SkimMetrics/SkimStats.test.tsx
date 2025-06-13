import React from 'react';
import { render, screen } from '@testing-library/react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { SkimStats } from './SkimStats';

describe('SkimStats', () => {
  it('renders all metric values provided', () => {
    render(
      <ThemeProvider theme={createTheme()}>
        <SkimStats metrics={[{ label: 'A', value: '1' }, { label: 'B', value: '2' }]} />
      </ThemeProvider>
    );
    expect(screen.getByText('A')).toBeInTheDocument();
    expect(screen.getByText('1')).toBeInTheDocument();
    expect(screen.getByText('B')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
  });
});
