
/*
<ai_context>
Forked from @backstage/plugin-catalog-react to customize the title and description for issue #2.
Displays an empty state with a custom error icon and message when annotations are missing from an entity.
Updated to use MUI4 and standalone EmptyState component for compatibility.
</ai_context>
*/

import React from 'react';
import { makeStyles } from '@material-ui/core/styles';
import Typography from '@material-ui/core/Typography';
import Button from '@material-ui/core/Button';
import ErrorIcon from '@material-ui/icons/Error';
import { CodeSnippet, Link } from '@backstage/core-components';
import { Entity } from '@backstage/catalog-model';
import { useEntity } from '@backstage/plugin-catalog-react';
import { EmptyState } from '../EmptyState/EmptyState';

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
    errorIcon: {
      verticalAlign: 'middle',
      marginRight: theme.spacing(1),
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
  return `Add the missing ${isSingular ? 'annotation' : 'annotations'} ${annotations
    .map(ann => `"${ann}"`)
    .join(', ')} to your ${entityKind} YAML file to enable this feature. Alternatively, use the Annotation Wizard to generate a complete "catalog-info.yaml".`;
}

/**
 * @public
 * Renders an empty state when an annotation is missing from an entity.
 */
export function MissingAnnotationEmptyState(props: {
  annotation: string | string[];
  readMoreUrl?: string;
}) {
  let entity: Entity | undefined;
  try {
    const entityContext = useEntity();
    entity = entityContext.entity;
  } catch (err) {
    // Ignore when entity context doesn't exist
  }

  const { annotation, readMoreUrl } = props;
  const annotations = Array.isArray(annotation) ? annotation : [annotation];
  const url =
    readMoreUrl ||
    'https://backstage.io/docs/features/software-catalog/well-known-annotations';
  const classes = useStyles();

  const entityKind = entity?.kind || 'Component';
  const { yamlText, lineNumbers } = generateYamlExample(annotations, entity);
  const description = `${generateDescription(annotations, entityKind)}\n\nThe example below highlights how to add the annotation(s) to your ${entityKind} YAML:\n\n${yamlText}`;

  return (
    <EmptyState
      missing="field"
      title={
        <>
          <ErrorIcon className={classes.errorIcon} color="error" />
          Missing Configuration
        </>
      }
      description={description}
      action={
        <Button color="primary" component={Link} to={url}>
          Read More
        </Button>
      }
    />
  );
}
      