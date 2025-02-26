
/*
<ai_context>
Forked from @backstage/plugin-catalog-react to customize the title and description for issue #2.
Updated to use CustomEmptyState with error icon and entity prop, single code snippet on right.
Uses Material-UI v4 styling system for compatibility.
</ai_context>
*/

import React from 'react';
import { makeStyles } from '@material-ui/core/styles';
import Typography from '@material-ui/core/Typography';
import Box from '@material-ui/core/Box';
import ErrorIcon from '@material-ui/icons/Error';
import { CodeSnippet, Link } from '@backstage/core-components';
import { Entity } from '@backstage/catalog-model';
import { CustomEmptyState } from '../CustomEmptyState';

/** @public */
export type MissingAnnotationEmptyStateClassKey = 'code';

const useStyles = makeStyles(
  theme => ({
    code: {
      borderRadius: 6,
      margin: theme.spacing(2, 0),
      background:
        theme.palette.type === 'dark' ? '#444' : theme.palette.common.white,
    },
  }),
  { name: 'MissingAnnotationEmptyState' },
);

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
  annotations:${annotations.map(ann => `\n    ${ann}: value`).join('')}
spec:
  type: ${type}
  owner: ${owner}`;

  let line = 6; // Line 6 is where annotations begin
  const lineNumbers: number[] = [];
  annotations.forEach(() => {
    lineNumbers.push(line);
    line++;
  });

  return {
    yamlText,
    lineNumbers,
  };
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
      to your {entityKind} YAML file to enable this feature. Alternatively, use
      the{' '}
      <Link to="/create/templates/default/catalog-info">
        Annotation Wizard
      </Link>{' '}
      to generate a complete <code>catalog-info.yaml</code>.
    </>
  );
}

/**
 * @public
 * Renders an empty state when an annotation is missing from an entity.
 */
export function MissingAnnotationEmptyState(props: {
  annotation: string | string[];
  entity: Entity;
}) {
  const { annotation, entity } = props;
  const annotations = Array.isArray(annotation) ? annotation : [annotation];
  const classes = useStyles();

  const entityKind = entity?.kind || 'Component';
  const { yamlText, lineNumbers } = generateYamlExample(annotations, entity);

  return (
    <CustomEmptyState
      title={
        <>
          <ErrorIcon color="error" style={{ verticalAlign: 'middle', marginRight: 8 }} />
          Missing Configuration
        </>
      }
      description={generateDescription(annotations, entityKind)}
      action={
        <Box className={classes.code}>
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
      