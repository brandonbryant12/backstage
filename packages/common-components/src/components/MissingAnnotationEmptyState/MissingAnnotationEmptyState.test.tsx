
/*
<ai_context>
Unit tests for MissingAnnotationEmptyState component as per issue #2 requirements.
Uses Backstage test-utils and MUI testing practices to verify rendering and basic functionality.
</ai_context>
*/

import React from 'react';
import { render, screen } from '@testing-library/react';
import { TestApiProvider } from '@backstage/test-utils';
import { catalogApiRef } from '@backstage/plugin-catalog-react';
import { MissingAnnotationEmptyState } from './MissingAnnotationEmptyState';

describe('MissingAnnotationEmptyState', () => {
  const mockCatalogApi = {};

  it('renders with single annotation correctly', () => {
    render(
      <TestApiProvider apis={[[catalogApiRef, mockCatalogApi]]}>
        <MissingAnnotationEmptyState annotation="my/annotation" />
      </TestApiProvider>,
    );

    expect(screen.getByText('Missing Configuration')).toBeInTheDocument();
    expect(
      screen.getByText(/Add the missing annotation my\/annotation to your Component YAML/i),
    ).toBeInTheDocument();
    expect(screen.getByText('Annotation Wizard')).toBeInTheDocument();
    expect(screen.getByText('Read More')).toBeInTheDocument();
    expect(screen.getByText(/apiVersion: backstage.io\/v1alpha1/i)).toBeInTheDocument();
  });

  it('renders with multiple annotations correctly', () => {
    render(
      <TestApiProvider apis={[[catalogApiRef, mockCatalogApi]]}>
        <MissingAnnotationEmptyState annotation={['ann1', 'ann2']} />
      </TestApiProvider>,
    );

    expect(screen.getByText('Missing Configuration')).toBeInTheDocument();
    expect(
      screen.getByText(/Add the missing annotations ann1, ann2 to your Component YAML/i),
    ).toBeInTheDocument();
    expect(screen.getByText('Annotation Wizard')).toBeInTheDocument();
    expect(screen.getByText('Read More')).toBeInTheDocument();
    expect(screen.getByText(/ann1: value/)).toBeInTheDocument();
    expect(screen.getByText(/ann2: value/)).toBeInTheDocument();
  });
});
      