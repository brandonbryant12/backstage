import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { EntityProvider } from '@backstage/plugin-catalog-react';
import { MissingAnnotationsCard } from './MissingAnnotationsCard';
import { ThemeProvider } from '@mui/material/styles';
import { createTheme } from '@mui/material/styles';
import { MemoryRouter } from 'react-router-dom';

jest.mock('@backstage/plugin-catalog-react', () => ({
  ...jest.requireActual('@backstage/plugin-catalog-react'),
  EntityRefLink: () => <>EntityRefLink</>
}));

describe('MissingAnnotationsCard', () => {
  const mockEntity = {
    apiVersion: 'backstage.io/v1alpha1',
    kind: 'Component',
    metadata: { name: 'test' },
    spec: { type: 'service', owner: 'user:default/test' }
  };

  const mockClipboard = {
    writeText: jest.fn(),
  };
  Object.assign(navigator, { clipboard: mockClipboard });

  const renderComponent = (ui: React.ReactElement, entity = mockEntity) => {
    return render(
      <MemoryRouter>
        <ThemeProvider theme={createTheme()}>
          <EntityProvider entity={entity}>
            {ui}
          </EntityProvider>
        </ThemeProvider>
      </MemoryRouter>
    );
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders with a single annotation', () => {
    renderComponent(
      <MissingAnnotationsCard title="Test Card" annotation="backstage.io/techdocs-ref" />
    );
    
    expect(screen.getByText('Test Card')).toBeInTheDocument();
    expect(screen.getByText('Missing Configuration')).toBeInTheDocument();
  });

  it('renders with multiple annotations', () => {
    renderComponent(
      <MissingAnnotationsCard 
        title="Multiple Annotations" 
        annotation={['backstage.io/techdocs-ref', 'backstage.io/owner']} 
      />
    );
    
    expect(screen.getByText('Multiple Annotations')).toBeInTheDocument();
    expect(screen.getByText('Missing Configuration')).toBeInTheDocument();
  });

  it('copies annotation to clipboard when button is clicked', () => {
    renderComponent(
      <MissingAnnotationsCard title="Test Card" annotation="backstage.io/techdocs-ref" />
    );
    
    const copyButton = screen.getByText('Copy Annotation Syntax');
    fireEvent.click(copyButton);
    
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith('backstage.io/techdocs-ref: value');
  });

  it('copies multiple annotations to clipboard when button is clicked', () => {
    renderComponent(
      <MissingAnnotationsCard 
        title="Multiple Annotations" 
        annotation={['backstage.io/techdocs-ref', 'backstage.io/owner']} 
      />
    );
    
    const copyButton = screen.getByText('Copy Annotation Syntax');
    fireEvent.click(copyButton);
    
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
      'backstage.io/techdocs-ref: value\nbackstage.io/owner: value'
    );
  });
});