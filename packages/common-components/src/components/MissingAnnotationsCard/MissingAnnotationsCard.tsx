
/*
<ai_context>
Created for issue #2 to provide a card wrapper around MissingAnnotationEmptyState.
Includes a customizable title, the empty state content with entity prop, and footer buttons.
Uses Material-UI v4 components for compatibility.
</ai_context>
*/

import React from 'react';
import { 
  Card, 
  CardHeader, 
  CardContent, 
  CardActions,
  Button,
  Typography
} from '@material-ui/core';
import { useEntity } from '@backstage/plugin-catalog-react';
import { MissingAnnotationEmptyState } from '../MissingAnnotationEmptyState/MissingAnnotationEmptyState';

export interface MissingAnnotationsCardProps {
  title: string;
  annotation: string | string[];
}

/**
 * @public
 * A card that displays a missing annotation message with actions.
 */
export function MissingAnnotationsCard(props: MissingAnnotationsCardProps) {
  const { title, annotation } = props;
  const { entity } = useEntity();
  const annotations = Array.isArray(annotation) ? annotation : [annotation];

  const handleCopy = () => {
    const annotationText = annotations
      .map(ann => `${ann}: value`)
      .join('\n');
    navigator.clipboard.writeText(annotationText);
  };

  return (
    <Card>
      <CardHeader 
        title={<Typography variant="h6">{title}</Typography>}
      />
      <CardContent>
        <MissingAnnotationEmptyState annotation={annotation} entity={entity} />
      </CardContent>
      <CardActions>
        <Button
          variant="outlined"
          color="default"
          href="https://backstage.io/docs/features/software-catalog/well-known-annotations"
          target="_blank"
        >
          Read More
        </Button>
        <Button variant="contained" color="primary" onClick={handleCopy}>
          Copy Annotation Syntax
        </Button>
      </CardActions>
    </Card>
  );
}
      