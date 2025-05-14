import React from 'react';
import { Card, CardContent, CircularProgress, Typography } from '@material-ui/core';
import { useEntity } from '@backstage/plugin-catalog-react';
import { useApplication } from '@internal/graphql';

export const ApplicationAboutCard: React.FC = () => {
  const { entity } = useEntity();
  const entityId = entity?.metadata?.name ?? '';
  const { application, loading, error } = useApplication(entityId);

  if (loading) return <CircularProgress />;
  if (error) {
    return (
      <Card>
        <CardContent>
          <Typography color="error">Failed to load application data</Typography>
        </CardContent>
      </Card>
    );
  }
  if (!application) return null;

  return (
    <Card>
      <CardContent>
        <Typography variant="h6">{application.name}</Typography>
        {application.description && (
          <Typography variant="body2">{application.description}</Typography>
        )}
        {application.agileEntityName && (
          <Typography variant="caption">Agile ID: {application.agileEntityName}</Typography>
        )}
      </CardContent>
    </Card>
  );
};