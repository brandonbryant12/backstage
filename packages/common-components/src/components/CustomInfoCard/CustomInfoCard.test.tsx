import React from 'react';
import { render, screen } from '@testing-library/react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { MemoryRouter } from 'react-router-dom';
import Button from '@mui/material/Button';
import { CustomInfoCard } from './CustomInfoCard';

const renderCard = (ui: React.ReactElement) =>
  render(
    <MemoryRouter>
      <ThemeProvider theme={createTheme()}>{ui}</ThemeProvider>
    </MemoryRouter>,
  );

describe('CustomInfoCard', () => {
  it('renders title with data sources', () => {
    renderCard(
      <CustomInfoCard title="Title" dataSources={['ds1', 'ds2']}>
        <div>content</div>
      </CustomInfoCard>,
    );

    expect(screen.getByText('Title')).toBeInTheDocument();
    expect(screen.getByTestId('data-sources')).toHaveTextContent('| ds1 | ds2');
    expect(screen.getByText('content')).toBeInTheDocument();
  });

  it('aligns footer buttons to the right', () => {
    renderCard(
      <CustomInfoCard
        title="Title"
        footerButtons={<Button>ok</Button>}
      >
        <div>content</div>
      </CustomInfoCard>,
    );

    const actions = screen.getByText('ok').closest('.MuiCardActions-root');
    expect(actions).toHaveStyle('justify-content: flex-end');
  });
});
