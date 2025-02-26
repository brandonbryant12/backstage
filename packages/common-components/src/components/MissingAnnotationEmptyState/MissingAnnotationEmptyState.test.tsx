
/*
<ai_context>
Updated unit tests for MissingAnnotationEmptyState component.
Adds MemoryRouter for Link components and tests entity prop with error icon.
Ensures compatibility with Material-UI v4 and single code snippet layout.
</ai_context>
*/

import React from 'react';
import { render, screen, within } from '@testing-library/react';
import { TestApiProvider } from '@backstage/test-utils';
import { catalogApiRef } from '@backstage/plugin-catalog-react';
import { MissingAnnotationEmptyState } from './MissingAnnotationEmptyState';
import { ThemeProvider } from '@material-ui/core/styles';
import { createTheme } from '@material-ui/core/styles';
import { MemoryRouter } from 'react-router-dom';

describe('MissingAnnotationEmptyState', () => {
  const mockCatalogApi = {};
  const theme = createTheme();
  const mockEntity = {
    kind: 'Component',
    metadata: { name: 'test' },
    spec: { type: 'website', owner: 'user:default/test' }
  };

  const renderWithTheme = (ui: React.ReactElement) => {
    return render(
      <MemoryRouter>
        <ThemeProvider theme={theme}>
          <TestApiProvider apis={[[catalogApiRef, mockCatalogApi]]}>
            {ui}
          </TestApiProvider>
        </ThemeProvider>
      </MemoryRouter>
    );
  };

  it('renders with single annotation correctly', () => {
    renderWithTheme(
      <MissingAnnotationEmptyState annotation="my/annotation" entity={mockEntity} />
    );

    expect(screen.getByText('Missing Configuration')).toBeInTheDocument();
    expect(screen.getByTestId('ErrorIcon')).toBeInTheDocument();
    const description = screen.getByText(/Add the missing annotation/i);
    expect(within(description).getByText('my/annotation')).toBeInTheDocument();
    expect(screen.getByText('Annotation Wizard')).toBeInTheDocument();
    const yamlCode = screen.getByText(/apiVersion: backstage.io\/v1alpha1/i).closest('pre');
    expect(yamlCode).toHaveTextContent('my/annotation: value');
    expect(screen.getAllByText(/apiVersion: backstage.io\/v1alpha1/i).length).toBe(1);
  });

  it('renders with multiple annotations correctly', () => {
    renderWithTheme(
      <MissingAnnotationEmptyState annotation={['ann1', 'ann2']} entity={mockEntity} />
    );

    expect(screen.getByText('Missing Configuration')).toBeInTheDocument();
    expect(screen.getByTestId('ErrorIcon')).toBeInTheDocument();
    const description = screen.getByText(/Add the missing annotations/i);
    expect(within(description).getByText('ann1')).toBeInTheDocument();
    expect(within(description).getByText('ann2')).toBeInTheDocument();
    expect(screen.getByText('Annotation Wizard')).toBeInTheDocument();
    const yamlCode = screen.getByText(/apiVersion: backstage.io\/v1alpha1/i).closest('pre');
    expect(yamlCode).toHaveTextContent('ann1: value');
    expect(yamlCode).toHaveTextContent('ann2: value');
    expect(screen.getAllByText(/apiVersion: backstage.io\/v1alpha1/i).length).toBe(1);
  });
});
      