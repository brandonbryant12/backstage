import * as React from 'react';
import {
  render,
  screen,
  fireEvent,
  waitFor,
} from '@testing-library/react';
import '@testing-library/jest-dom';
import Accordion, { AccordionItem } from './Accordian';

const items: AccordionItem[] = [
  { id: '1', header: 'Item 1', body: 'Body 1' },
  { id: '2', header: 'Item 2', body: 'Body 2' },
  { id: '3', header: 'Item 3', body: 'Body 3' },
];

describe('<Accordion /> – non-exclusive (default)', () => {
  test('renders headers and keeps bodies hidden initially', () => {
    render(<Accordion items={items} />);
    items.forEach(({ header, body }) => {
      expect(screen.getByText(header)).toBeInTheDocument();
      expect(screen.getByText(body)).not.toBeVisible(); // still in DOM, just collapsed
    });
  });

  test('opens and closes a single panel on click', async () => {
    render(<Accordion items={items} />);
    const header = screen.getByText('Item 1');

    fireEvent.click(header);
    expect(await screen.findByText('Body 1')).toBeVisible();

    fireEvent.click(header);
    await waitFor(() =>
      expect(screen.getByText('Body 1')).not.toBeVisible(),
    );
  });

  test('allows multiple panels to stay open', async () => {
    render(<Accordion items={items} />);

    fireEvent.click(screen.getByText('Item 1'));
    await screen.findByText('Body 1');

    fireEvent.click(screen.getByText('Item 2'));
    await screen.findByText('Body 2');

    expect(screen.getByText('Body 1')).toBeVisible();
    expect(screen.getByText('Body 2')).toBeVisible();
  });
});

describe('<Accordion /> – exclusive mode', () => {
  test('keeps only one panel open', async () => {
    render(<Accordion items={items} exclusive />);

    const h1 = screen.getByText('Item 1');
    const h2 = screen.getByText('Item 2');

    fireEvent.click(h1);
    await screen.findByText('Body 1');

    fireEvent.click(h2);
    await screen.findByText('Body 2');
    await waitFor(() =>
      expect(screen.getByText('Body 1')).not.toBeVisible(),
    );
  });

  test('clicking an open header closes it', async () => {
    render(<Accordion items={items} exclusive />);
    const h1 = screen.getByText('Item 1');

    fireEvent.click(h1);
    await screen.findByText('Body 1');

    fireEvent.click(h1);
    await waitFor(() =>
      expect(screen.getByText('Body 1')).not.toBeVisible(),
    );
  });
});