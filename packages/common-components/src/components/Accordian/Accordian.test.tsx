import * as React from 'react';
import {
  render,
  screen,
  fireEvent,
  waitFor,
} from '@testing-library/react';
import '@testing-library/jest-dom';
import Accordion from './Accordian';

const items = [
  { header: 'Item 1', body: 'Body 1' },
  { header: 'Item 2', body: 'Body 2' },
  { header: 'Item 3', body: 'Body 3' },
];

describe('<Accordion /> – non-exclusive (default)', () => {
  test('renders headers and keeps bodies hidden initially', () => {
    render(<Accordion items={items} />);
    items.forEach(({ header, body }) => {
      expect(screen.getByText(header)).toBeInTheDocument();
      expect(screen.getByText(body)).not.toBeVisible();
    });
  });

  test('opens and closes a single panel on click', async () => {
    render(<Accordion items={items} />);
    const header = screen.getByText('Item 1');

    fireEvent.click(header);
    expect(await screen.findByText('Body 1')).toBeVisible();

    fireEvent.click(header);
    await waitFor(() =>
      expect(screen.getByText('Body 1')).not.toBeVisible()
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
      expect(screen.getByText('Body 1')).not.toBeVisible()
    );
  });

  test('clicking an open header closes it', async () => {
    render(<Accordion items={items} exclusive />);
    const h1 = screen.getByText('Item 1');

    fireEvent.click(h1);
    await screen.findByText('Body 1');

    fireEvent.click(h1);
    await waitFor(() =>
      expect(screen.getByText('Body 1')).not.toBeVisible()
    );
  });
});

describe('<Accordion /> – defaultExpandedId support', () => {
  test('non-exclusive: string defaultExpandedId opens that single panel', () => {
    render(<Accordion items={items} defaultExpandedId="panel1" />);
    expect(screen.getByText('Body 2')).toBeVisible();
    expect(screen.getByText('Body 1')).not.toBeVisible();
    expect(screen.getByText('Body 3')).not.toBeVisible();
  });

  test('non-exclusive: array defaultExpandedId opens multiple panels', () => {
    render(
      <Accordion items={items} defaultExpandedId={['panel0', 'panel2']} />
    );
    expect(screen.getByText('Body 1')).toBeVisible();
    expect(screen.getByText('Body 2')).not.toBeVisible();
    expect(screen.getByText('Body 3')).toBeVisible();
  });

  test('exclusive: string defaultExpandedId opens that panel only', () => {
    render(
      <Accordion items={items} exclusive defaultExpandedId="panel2" />
    );
    expect(screen.getByText('Body 3')).toBeVisible();
    expect(screen.getByText('Body 1')).not.toBeVisible();
    expect(screen.getByText('Body 2')).not.toBeVisible();
  });

  test('exclusive: array defaultExpandedId uses first element only', () => {
    render(
      <Accordion
        items={items}
        exclusive
        defaultExpandedId={['panel2', 'panel1']}
      />
    );
    expect(screen.getByText('Body 3')).toBeVisible();
    expect(screen.getByText('Body 2')).not.toBeVisible();
    expect(screen.getByText('Body 1')).not.toBeVisible();
  });
});

describe('<Accordion /> – custom item `id` support', () => {
  const customItems = [
    { id: 'first', header: 'A', body: 'Alpha' },
    { header: 'B', body: 'Bravo' },      // falls back to panel1
    { id: 'third', header: 'C', body: 'Charlie' },
  ];

  test('renders with mix of custom and default IDs without expanded', () => {
    render(<Accordion items={customItems} />);
    customItems.forEach(({ body }) => {
      expect(screen.getByText(body)).not.toBeVisible();
    });
  });

  test('defaultExpandedId matches custom id', () => {
    render(<Accordion items={customItems} defaultExpandedId="first" />);
    expect(screen.getByText('Alpha')).toBeVisible();
    expect(screen.getByText('Bravo')).not.toBeVisible();
    expect(screen.getByText('Charlie')).not.toBeVisible();
  });

  test('defaultExpandedId can open fallback panel by index', () => {
    render(
      <Accordion items={customItems} defaultExpandedId="panel1" />
    );
    expect(screen.getByText('Bravo')).toBeVisible();
    expect(screen.getByText('Alpha')).not.toBeVisible();
    expect(screen.getByText('Charlie')).not.toBeVisible();
  });

  test('exclusive + custom id behaves correctly', async () => {
    render(
      <Accordion
        items={customItems}
        exclusive
        defaultExpandedId="third"
      />
    );
    expect(screen.getByText('Charlie')).toBeVisible();
    fireEvent.click(screen.getByText('A'));
    await waitFor(() =>
      expect(screen.getByText('Alpha')).toBeVisible()
    );
    await waitFor(() =>
      expect(screen.getByText('Charlie')).not.toBeVisible()
    );
  });
});
