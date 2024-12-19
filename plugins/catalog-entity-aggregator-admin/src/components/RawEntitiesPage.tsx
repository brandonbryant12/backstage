import React, { useState } from 'react';
import { useRawEntities } from '../hooks/useRawEntities';
import { Page, Header, Content, Progress, ResponseErrorPanel } from '@backstage/core-components';
import { makeStyles } from '@material-ui/core/styles';
import { Typography, Box, Button } from '@material-ui/core';
import { CodeSnippet } from '@backstage/core-components';

const useStyles = makeStyles({
  container: {
    marginTop: '2rem',
  },
  navigation: {
    marginBottom: '1rem',
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
  },
});

export const RawEntitiesPage = () => {
  const classes = useStyles();
  const { loading, error, rawEntities, mergedEntity } = useRawEntities();
  const [currentIndex, setCurrentIndex] = useState(0);

  const handleNext = () => {
    if (!rawEntities) return;
    setCurrentIndex((prev) => (prev + 1) % rawEntities.length);
  };

  const handlePrev = () => {
    if (!rawEntities) return;
    setCurrentIndex((prev) =>
      prev === 0 ? rawEntities.length - 1 : prev - 1,
    );
  };

  if (loading) {
    return (
      <Page themeId="tool">
        <Header title="Raw Entities" subtitle="Viewing raw aggregated entity data" />
        <Content>
          <Progress />
        </Content>
      </Page>
    );
  }

  if (error) {
    return (
      <Page themeId="tool">
        <Header title="Raw Entities" subtitle="Viewing raw aggregated entity data" />
        <Content>
          <ResponseErrorPanel error={error} />
        </Content>
      </Page>
    );
  }

  if (!mergedEntity || !rawEntities) {
    return (
      <Page themeId="tool">
        <Header title="Raw Entities" subtitle="No data available" />
        <Content>
          <Typography variant="body1">No raw entity data could be found.</Typography>
        </Content>
      </Page>
    );
  }

  const currentEntity = rawEntities[currentIndex];

  return (
    <Page themeId="tool">
      <Header title="Raw Entities" subtitle="Viewing raw aggregated entity data" />
      <Content className={classes.container}>
        <Typography variant="h6">Merged Entity</Typography>
        <CodeSnippet
          text={JSON.stringify(mergedEntity, null, 2)}
          language="json"
          showLineNumbers
        />

        <Box mt={4}>
          <Typography variant="h6">
            Raw Entities from Various Data Sources
          </Typography>
          <Typography variant="body1">
            Below are the raw entities from each data source that formed the merged entity.
          </Typography>
          {rawEntities.length > 1 && (
            <div className={classes.navigation}>
              <Button variant="outlined" onClick={handlePrev}>
                Previous
              </Button>
              <Typography variant="body2">
                {`Entity ${currentIndex + 1} of ${rawEntities.length} (${currentEntity.datasource})`}
              </Typography>
              <Button variant="outlined" onClick={handleNext}>
                Next
              </Button>
            </div>
          )}

          <CodeSnippet
            text={JSON.stringify(currentEntity, null, 2)}
            language="json"
            showLineNumbers
          />
        </Box>
      </Content>
    </Page>
  );
};