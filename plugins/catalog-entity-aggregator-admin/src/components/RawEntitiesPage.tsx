import React, { useState } from 'react';
import { useRawEntities } from '../hooks/useRawEntities';
import { Page, Header, Content, Progress, ResponseErrorPanel } from '@backstage/core-components';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import { CodeSnippet } from '@backstage/core-components';

const styles = {
  container: {
    marginTop: 2,
  },
  tabContent: {
    mt: 2,
  },
};

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <Box
      role="tabpanel"
      hidden={value !== index}
      id={`entity-tabpanel-${index}`}
      aria-labelledby={`entity-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ pt: 2 }}>{children}</Box>}
    </Box>
  );
}

export const RawEntitiesPage = () => {
  const { loading, error, rawEntities, mergedEntity } = useRawEntities();
  const [currentTab, setCurrentTab] = useState(0);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setCurrentTab(newValue);
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

  return (
    <Page themeId="tool">
      <Header title="Raw Entities" subtitle="Viewing raw aggregated entity data" />
      <Content>
        <Box sx={styles.container}>
          <Typography variant="h6" gutterBottom>Entity Data</Typography>
          
          <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
            <Tabs
              value={currentTab}
              onChange={handleTabChange}
              aria-label="entity data tabs"
            >
              <Tab label="Merged Entity" />
              {rawEntities.map((entity, index) => (
                <Tab 
                  key={entity.datasource} 
                  label={entity.datasource}
                  id={`entity-tab-${index + 1}`}
                  aria-controls={`entity-tabpanel-${index + 1}`}
                />
              ))}
            </Tabs>
          </Box>

          <TabPanel value={currentTab} index={0}>
            <CodeSnippet
              text={JSON.stringify(mergedEntity, null, 2)}
              language="json"
              showLineNumbers
            />
          </TabPanel>

          {rawEntities.map((entity, index) => (
            <TabPanel key={entity.datasource} value={currentTab} index={index + 1}>
              <CodeSnippet
                text={JSON.stringify(entity, null, 2)}
                language="json"
                showLineNumbers
              />
            </TabPanel>
          ))}
        </Box>
      </Content>
    </Page>
  );
};