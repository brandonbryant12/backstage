import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { MemoryRouter } from 'react-router-dom';
import { PreuseCard } from './PreuseCard';

const renderCard = (ui: React.ReactElement) =>
  render(
    <MemoryRouter>
      <ThemeProvider theme={createTheme()}>{ui}</ThemeProvider>
    </MemoryRouter>,
  );

describe('PreuseCard', () => {
  it('shows skim content when collapsed and hides children', () => {
    renderCard(
      <PreuseCard title="Title" skimContent={<span>skim</span>}>
        <div>details</div>
      </PreuseCard>,
    );

    expect(screen.getByText('skim')).toBeInTheDocument();
    expect(screen.queryByText('details')).toBeNull();
  });

  it('expands to show children and hide skim content', () => {
    renderCard(
      <PreuseCard title="Title" skimContent={<span>skim</span>}>
        <div>details</div>
      </PreuseCard>,
    );

    fireEvent.click(screen.getByTestId('toggle-button'));

    expect(screen.getByText('details')).toBeInTheDocument();
    expect(screen.queryByText('skim')).toBeNull();
  });
});
