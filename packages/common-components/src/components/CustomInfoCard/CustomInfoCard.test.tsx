import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { MemoryRouter } from 'react-router-dom';
import Button from '@mui/material/Button';
import { CustomInfoCard } from './CustomInfoCard';
import { SkimStats } from '../SkimMetrics/SkimStats';

const renderCard = (ui: React.ReactElement) =>
  render(
    <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <ThemeProvider theme={createTheme()}>{ui}</ThemeProvider>
    </MemoryRouter>,
  );

describe('CustomInfoCard', () => {
it('shows datasources expanded and hides when collapsed, revealing skimContent', async () => {
renderCard(
  <CustomInfoCard
    title="Title"
    dataSources={['ds1']}
    skimContent={<div>skim</div>}
  >
    <div>body</div>
  </CustomInfoCard>
);

// dataSources should be visible initially (expanded state)
expect(screen.getByText('ds1')).toBeVisible();
// skimContent should not be visible when expanded
expect(screen.queryByText('skim')).toBeNull();
// body content should be visible when expanded
expect(screen.getByText('body')).toBeVisible();

// collapse the card
fireEvent.click(screen.getByLabelText('collapse'));

// Wait for the collapse animation to complete
await waitFor(() => {
  // dataSources should still be visible (they're always in the header)
  expect(screen.getByText('ds1')).toBeVisible();
  // skimContent should now be visible when collapsed
  expect(screen.getByText('skim')).toBeInTheDocument();
  // body content should be hidden when collapsed
  expect(screen.queryByText('body')).toBeNull();
});
});

it('aligns footer buttons right', () => {
renderCard(
  <CustomInfoCard
    title="t"
    footerButtonsComponent={<Button>ok</Button>}
  >
    <span>c</span>
  </CustomInfoCard>
);
const actions = screen.getByText('ok').closest('.MuiCardActions-root');
expect(actions).toHaveStyle('justify-content: flex-end');
});

it('executes menu action on click', () => {
const spy = jest.fn();
renderCard(
  <CustomInfoCard
    title="t"
    menuActions={[{ label: 'A', onClick: spy }]}
  >
    <span>c</span>
  </CustomInfoCard>
);
fireEvent.click(screen.getByLabelText('settings'));
fireEvent.click(screen.getByText('A'));
expect(spy).toHaveBeenCalled();
});

it('renders deep-dive link when deepDivePath provided', () => {
  renderCard(
    <CustomInfoCard
      title="t"
      deepDivePath="/deep"
    >
      <span>c</span>
    </CustomInfoCard>,
  );
  const link = screen.getByLabelText('deep-dive');
  expect(link).toBeInTheDocument();
  expect(link.getAttribute('href')).toBe('/deep');
});
});