import React, { useState } from 'react';
import { useAllEntityRefs } from '../hooks/useAllEntityRefs';
import { useRawEntityDetail } from '../hooks/useRawEntityDetail';
import { AggregatorEntityRefData } from '../hooks/useAllEntityRefs';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Button from '@mui/material/Button';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Typography from '@mui/material/Typography';
import { CodeSnippet, Progress, ResponseErrorPanel, Table, TableColumn, Content } from '@backstage/core-components';
import Box from '@mui/material/Box';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel({ children, value, index }: TabPanelProps) {
  if (value !== index) return null;
  
  return (
    <Box
      role="tabpanel"
      id={`entity-tabpanel-${index}`}
      aria-labelledby={`entity-tab-${index}`}
      sx={{ paddingTop: '16px' }}
    >
      {children}
    </Box>
  );
}

export const EntityAggregatorAdminPage = () => {
  const [dialogState, setDialogState] = useState({
    isOpen: false,
    selectedRef: '',
    currentTab: 0,
  });

  const { loading, error, data } = useAllEntityRefs();
  
  const { 
    loading: detailLoading = false, 
    error: detailError, 
    rawEntities, 
    mergedEntity 
  } = useRawEntityDetail(dialogState.selectedRef || '') || {};

  const handleOpenDialog = (ref: string) => {
    setDialogState({ isOpen: true, selectedRef: ref, currentTab: 0 });
  };

  const handleCloseDialog = () => {
    setDialogState({ isOpen: false, selectedRef: '', currentTab: 0 });
  };

  const handleTabChange = (_: React.SyntheticEvent, newValue: number) => {
    setDialogState(prev => ({ ...prev, currentTab: newValue }));
  };

  const columns: TableColumn<AggregatorEntityRefData>[] = [
    {
      title: 'Entity Ref',
      field: 'entityRef',
      highlight: true,
    },
    {
      title: 'Sources',
      field: 'providerCount',
      type: 'numeric',
    },
    {
      title: 'Actions',
      render: rowData => (
        <Button
          size="small"
          variant="contained"
          color="primary"
          onClick={() => handleOpenDialog(rowData.entityRef)}
        >
          View Details
        </Button>
      ),
    },
  ];

  if (loading) {
    return (
      <Content>
        <Progress />
      </Content>
    );
  }

  if (error) {
    return (
      <Content>
        <ResponseErrorPanel error={error} />
      </Content>
    );
  }

  if (!data || data.length === 0) {
    return (
      <Content>
        <Typography>No aggregator entities found.</Typography>
      </Content>
    );
  }

  return (
    <Content>
      <Box sx={{ maxWidth: '800px', marginLeft: 'auto', marginRight: 'auto' }}>
        <Table
          title="Entities"
          options={{ 
            search: true, 
            paging: true,
            pageSize: 20,
          }}
          columns={columns}
          data={data}
        />
      </Box>

      <Dialog 
        open={dialogState.isOpen} 
        onClose={handleCloseDialog} 
        fullWidth 
        maxWidth="md"
      >
        <DialogTitle>Entity Details</DialogTitle>
        <DialogContent>
          {detailLoading && <Progress />}
          {detailError && <ResponseErrorPanel error={detailError} />}

          {!detailLoading && !detailError && (mergedEntity || rawEntities?.length) && (
            <Box sx={{ width: '100%' }}>
              <Box sx={{ borderBottom: 1, borderColor: 'divider', marginBottom: '16px' }}>
                <Tabs 
                  value={dialogState.currentTab} 
                  onChange={handleTabChange}
                  aria-label="entity data tabs"
                  sx={{ 
                    minHeight: '48px',
                    '& .MuiTab-root': {
                      paddingTop: '12px',
                      paddingBottom: '12px',
                      paddingLeft: '16px',
                      paddingRight: '16px',
                    }
                  }}
                >
                  <Tab label="Merged Entity" />
                  {rawEntities?.map((r, idx) => (
                    <Tab 
                      key={`${r.providerId}_${idx}`} 
                      label={r.providerId}
                    />
                  ))}
                </Tabs>
              </Box>

              <TabPanel value={dialogState.currentTab} index={0}>
                {mergedEntity && (
                  <CodeSnippet
                    text={JSON.stringify(mergedEntity, null, 2)}
                    language="json"
                    showLineNumbers
                  />
                )}
              </TabPanel>

              {rawEntities?.map((r, idx) => (
                <TabPanel 
                  key={r.providerId} 
                  value={dialogState.currentTab} 
                  index={idx + 1}
                >
                  <CodeSnippet
                    text={JSON.stringify(r.entity, null, 2)}
                    language="json"
                    showLineNumbers
                  />
                </TabPanel>
              ))}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog} color="primary">
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </Content>
  );
};