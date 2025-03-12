import React from 'react';
import { renderInTestApp, TestApiProvider } from '@backstage/test-utils';
import { CustomHomePage } from './CustomHomePage';
import { searchPlugin } from '@backstage/plugin-search';
import { searchApiRef } from '@backstage/plugin-search-react';
import { screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

describe('CustomHomePage', () => {
  it('renders without crashing and handles search', async () => {
    const searchApiMock = {
      query: jest.fn().mockResolvedValue({ results: [] }),
    };
    await renderInTestApp(
      <TestApiProvider
        apis={[
          [searchApiRef, searchApiMock],
        ]}
      >
        <CustomHomePage />
      </TestApiProvider>,
      {
        mountedRoutes: {
          '/search': searchPlugin.routes.root,
        }
      }
    );
    expect(screen.getByText('Hello World')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Search in Backstage')).toBeInTheDocument();
    
    const searchInput = screen.getByPlaceholderText('Search in Backstage');
    await userEvent.type(searchInput, 'test query');
    fireEvent.keyDown(searchInput, { key: 'Enter', code: 'Enter' });
    
    expect(searchApiMock.query).toHaveBeenCalled();
  });
});