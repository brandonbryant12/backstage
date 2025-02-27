import Grid from '@mui/material/Grid';
import Typography from '@mui/material/Typography';
import React, { ReactNode } from 'react';

/**
 * Customized empty state component with side-by-side layout
 * @public
 */
export function CustomEmptyState(props: {
  title: ReactNode;
  description?: string | JSX.Element;
  action?: JSX.Element;
}) {
  const { title, description, action } = props;

  return (
    <Grid
      container
      direction="row"
      justifyContent="space-between"
      alignItems="flex-start"
      spacing={2}
      sx={{
        backgroundColor: theme => theme.palette.background.default,
        padding: theme => theme.spacing(2, 2, 2, 2),
      }}
    >
      <Grid item xs={12} md={6}>
        <Grid container direction="column" spacing={1}>
          <Grid item xs>
            <Typography variant="h5">{title}</Typography>
          </Grid>
          {description && (
            <Grid item xs>
              <Typography variant="body2">{description}</Typography>
            </Grid>
          )}
        </Grid>
      </Grid>
      {action && (
        <Grid item xs={12} md={6} sx={{ mt: -0.5 }}>
          {action}
        </Grid>
      )}
    </Grid>
  );
}