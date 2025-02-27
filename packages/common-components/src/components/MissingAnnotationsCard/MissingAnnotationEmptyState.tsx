import React from 'react';
import Box from '@mui/material/Box';
import ErrorIcon from '@mui/icons-material/Error';
import { CodeSnippet } from '@backstage/core-components';
import { EntityRefLink } from '@backstage/plugin-catalog-react';
import { Entity } from '@backstage/catalog-model';
import { CustomEmptyState } from './CustomEmptyState';

/**
 * Generates example YAML with specified annotations
 */
function generateYamlExample(
  annotations: string[],
  entity?: Entity,
): { yamlText: string; lineNumbers: number[] } {
  const kind = entity?.kind || 'Component';
  const name = entity?.metadata.name || 'example';
  const type = entity?.spec?.type || 'website';
  const owner = entity?.spec?.owner || 'user:default/guest';

  const yamlText = `apiVersion: backstage.io/v1alpha1
kind: ${kind}
metadata:
  name: ${name}
  annotations:
${annotations.map(ann => `    ${ann}: value`).join('\n')}
spec:
  type: ${type}
  owner: ${owner}`;

  const lineNumbers = calculateHighlightedLines(annotations);

  return {
    yamlText,
    lineNumbers,
  };
}

function calculateHighlightedLines(annotations: string[]): number[] {
  const startLine = 6;
  return annotations.map((_, index) => startLine + index);
}

function generateDescription(annotations: string[], entityKind = 'Component') {
  const isSingular = annotations.length <= 1;
  return (
    <>
      Add the missing {isSingular ? 'annotation' : 'annotations'}{' '}
      {annotations
        .map(ann => <code key={ann}>{ann}</code>)
        .reduce((prev, curr) => (
          <>
            {prev}, {curr}
          </>
        ))}{' '}
      to your {entityKind} YAML file to enable this feature.
      
      <Box component="p" mt={1} mb={1}>
        The figure example shows an annotation in a component YAML file (highlighted text).
      </Box>
      
      Alternatively, use the{' '}
      <EntityRefLink entityRef={{ kind: 'Template', namespace: 'default', name: 'catalog-info-template' }}>
        Annotation Wizard
      </EntityRefLink>{' '}
      to generate a complete <code>catalog-info.yaml</code>.
    </>
  );
}

export function MissingAnnotationEmptyState(props: {
  annotation: string | string[];
  entity: Entity;
}) {
  const { annotation, entity } = props;
  const annotations = Array.isArray(annotation) ? annotation : [annotation];

  const entityKind = entity?.kind || 'Component';
  const { yamlText, lineNumbers } = generateYamlExample(annotations, entity);

  return (
    <CustomEmptyState
      title={
        <Box sx={{ display: 'flex', alignItems: 'center', whiteSpace: 'nowrap' }}>
          <ErrorIcon color="error" style={{ marginRight: 8 }} />
          Missing Configuration
        </Box>
      }
      description={generateDescription(annotations, entityKind)}
      action={
        <Box sx={{
          borderRadius: 6,
          background: theme => theme.palette.mode === 'dark' ? '#444' : theme.palette.common.white,
          mt: 0.5,
        }}>
          <CodeSnippet
            text={yamlText}
            language="yaml"
            showLineNumbers
            highlightedNumbers={lineNumbers}
            customStyle={{ background: 'inherit', fontSize: '115%' }}
          />
        </Box>
      }
    />
  );
}
