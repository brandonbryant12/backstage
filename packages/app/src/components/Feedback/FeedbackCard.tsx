import React from 'react';
import { Card, CardContent, Button, makeStyles, Grid } from '@material-ui/core';
import FeedbackIcon from '@material-ui/icons/Feedback';
import ArrowUpwardIcon from '@material-ui/icons/ArrowUpward';

const useStyles = makeStyles(theme => ({
  root: {
    marginTop: theme.spacing(2),
    marginBottom: theme.spacing(2),
  },
  button: {
    margin: theme.spacing(1),
  },
}));

export const FeedbackCard = () => {
  const classes = useStyles();

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  };

  // Replace with your actual feedback mechanism link or function
  const handleFeedbackClick = () => {
    window.open('mailto:feedback@example.com?subject=Backstage Feedback', '_blank');
    // Or trigger a feedback modal, etc.
  };

  return (
    <Card className={classes.root}>
      <CardContent>
        <Grid container justify="space-between" alignItems="center">
          <Grid item>
            <Button
              variant="outlined"
              color="primary"
              startIcon={<FeedbackIcon />}
              onClick={handleFeedbackClick}
              className={classes.button}
            >
              Leave Feedback
            </Button>
          </Grid>
          <Grid item>
            <Button
              variant="outlined"
              startIcon={<ArrowUpwardIcon />}
              onClick={scrollToTop}
              className={classes.button}
            >
              Back to Top
            </Button>
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );
};