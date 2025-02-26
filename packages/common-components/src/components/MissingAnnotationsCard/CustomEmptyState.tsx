
/*
<ai_context>
Forked from @backstage/core-components EmptyState for issue #2.
Removes image display and adjusts layout to place code snippet on right side.
Updated to accept ReactNode title and fix duplicate action rendering.
Moved to MissingAnnotationsCard directory for component consolidation.
Uses Material-UI v4 Grid system for compatibility.
</ai_context>
*/

import Grid from '@material-ui/core/Grid';
import { makeStyles } from '@material-ui/core/styles';
import Typography from '@material-ui/core/Typography';
import React, { ReactNode } from 'react';

/** @public */
export type CustomEmptyStateClassKey = 'root' | 'action' | 'content';

const useStyles = makeStyles(
  theme => ({
    root: {
      backgroundColor: theme.palette.background.default,
      padding: theme.spacing(2, 0, 0, 0),
    },
    action: {
      marginTop: theme.spacing(2),
    },
    content: {
      margin: theme.spacing(2, 0),
    },
  }),
  { name: 'CustomEmptyState' },
);

type Props = {
  title: ReactNode;
  description?: string | JSX.Element;
  action?: JSX.Element;
};

/**
 * Customized empty state component with side-by-side layout
 * @public
 */
export function CustomEmptyState(props: Props) {
  const { title, description, action } = props;
  const classes = useStyles();

  return (
    <Grid
      container
      direction="row"
      justifyContent="space-between"
      alignItems="flex-start"
      className={classes.root}
      spacing={2}
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
        <Grid item xs={12} md={6} className={classes.content}>
          {action}
        </Grid>
      )}
    </Grid>
  );
}
      