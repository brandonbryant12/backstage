import React from 'react';
import Card from '@mui/material/Card';
import CardHeader from '@mui/material/CardHeader';
import CardContent from '@mui/material/CardContent';
import CardActions from '@mui/material/CardActions';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import { useEntity } from '@backstage/plugin-catalog-react';
import { MissingAnnotationEmptyState } from './MissingAnnotationEmptyState';

export { CustomEmptyState } from './CustomEmptyState';

export interface MissingAnnotationsCardProps {
  title: string;
  annotation: string | string[];
}
/**
 * @public
 * A card that displays a missing annotation me
 * 
 * ssage with actions.
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

  const footerButtons = () => {
    return (
      <>
        <Button
          variant="outlined"
          href="https://backstage.io/docs/features/software-catalog/well-known-annotations"
          target="_blank"
        >
          Read More
        </Button>
        <Button variant="contained" color="primary" onClick={handleCopy}>
          Copy Annotation Syntax
        </Button>
      </>
    );
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
        {footerButtons()}
      </CardActions>
    </Card>
  );
}