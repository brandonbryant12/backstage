
/*
<ai_context>
Forked from @backstage/core-components EmptyState for issue #2.
Removes image display and adjusts layout to place code snippet on right side.
Updated to accept ReactNode title and fix duplicate action rendering.
Moved to MissingAnnotationsCard directory for component consolidation.
Uses Material-UI v5 Grid system.
</ai_context>
*/

import Grid from '@mui/material/Grid';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
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
        padding: theme => theme.spacing(2, 0, 0, 0),
      }}
    >
      <Grid item xs={12} md={6}>
        <Grid container direction="column">
          <Grid item xs>
            <Typography variant="h5">{title}</Typography>
          </Grid>
          {description && (
            <Grid item xs>
              <Typography variant="body1">{description}</Typography>
            </Grid>
          )}
        </Grid>
      </Grid>
      {action && (
        <Grid item xs={12} md={6}>
          <Box sx={{ margin: theme => theme.spacing(2, 0) }}>
            {action}
          </Box>
        </Grid>
      )}
    </Grid>
  );
}
      