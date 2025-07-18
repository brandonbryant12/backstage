import React from 'react';
import { CustomInfoCard } from 'common-components';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Grid from '@mui/material/Grid';
import Button from '@mui/material/Button';
import { useResilienceData } from './useResilienceData';

const ResilienceSkimContent = () => {
  const { chaosExperiment, incidents } = useResilienceData();
  
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
      <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
        {chaosExperiment.compliant ? 'Yes' : 'No'}
      </Typography>
      <Typography variant="body2" color="text.secondary">
        Chaos Experiment Compliant
      </Typography>
      <Typography variant="body2" color="text.secondary">
        Incident Management
      </Typography>
      <Box sx={{ bgcolor: 'error.main', color: 'common.white', px: 1.5, py: 0.5, borderRadius: 0, minWidth: 32, textAlign: 'center', fontSize: '0.875rem', fontWeight: 'bold' }}>
        {incidents.critical}
      </Box>
      <Box sx={{ bgcolor: 'warning.dark', color: 'common.white', px: 1.5, py: 0.5, borderRadius: 0, minWidth: 32, textAlign: 'center', fontSize: '0.875rem', fontWeight: 'bold' }}>
        {incidents.high}
      </Box>
      <Box sx={{ bgcolor: 'warning.main', color: 'common.white', px: 1.5, py: 0.5, borderRadius: 0, minWidth: 32, textAlign: 'center', fontSize: '0.875rem', fontWeight: 'bold' }}>
        {incidents.medium}
      </Box>
      <Box sx={{ bgcolor: 'info.main', color: 'common.white', px: 1.5, py: 0.5, borderRadius: 0, minWidth: 32, textAlign: 'center', fontSize: '0.875rem', fontWeight: 'bold' }}>
        {incidents.low}
      </Box>
    </Box>
  );
};

const ResilienceExpandedContent = () => {
  const { chaosExperiment, incidents } = useResilienceData();
  
  return (
    <Grid container spacing={2}>
      <Grid item xs={6}>
        <Typography variant="subtitle2" sx={{ mb: 1, color: 'text.secondary' }}>
          CHAOS EXPERIMENT
        </Typography>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
          <Typography variant="body2">
            Chaos Experiments Compliant: {chaosExperiment.compliant ? 'Yes' : 'No'}.
          </Typography>
          <Typography variant="body2">
            In Scope: {chaosExperiment.inScope ? 'Yes' : 'No'}
          </Typography>
          <Typography variant="body2">
            Catchup Date: {chaosExperiment.catchupDate}
          </Typography>
          <Typography variant="body2">
            Snapshot Facing Date: {chaosExperiment.snapshotFacingDate || 'NO'}
          </Typography>
        </Box>
      </Grid>
      <Grid item xs={6}>
        <Typography variant="subtitle2" sx={{ mb: 1, color: 'text.secondary' }}>
          INCIDENT MANAGEMENT
        </Typography>
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          <Box sx={{ bgcolor: 'error.main', color: 'common.white', px: 2, py: 1, borderRadius: 0, textAlign: 'center', fontSize: '0.875rem', fontWeight: 'bold' }}>
            Critical {incidents.critical}
          </Box>
          <Box sx={{ bgcolor: 'warning.dark', color: 'common.white', px: 2, py: 1, borderRadius: 0, textAlign: 'center', fontSize: '0.875rem', fontWeight: 'bold' }}>
            High {incidents.high}
          </Box>
          <Box sx={{ bgcolor: 'warning.main', color: 'common.white', px: 2, py: 1, borderRadius: 0, textAlign: 'center', fontSize: '0.875rem', fontWeight: 'bold' }}>
            Medium {incidents.medium}
          </Box>
          <Box sx={{ bgcolor: 'info.main', color: 'common.white', px: 2, py: 1, borderRadius: 0, textAlign: 'center', fontSize: '0.875rem', fontWeight: 'bold' }}>
            Low & Below {incidents.low}
          </Box>
        </Box>
      </Grid>
    </Grid>
  );
};

export const ResilienceCard = () => {
  return (
    <CustomInfoCard
      title="Resilience"
      subheader="Resilience Information"
      dataSources={['Chaos Experiment', 'Incident Management']}
      skimContent={<ResilienceSkimContent />}
      footerButtonsComponent={
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button variant="outlined" size="small" onClick={() => console.log('View Details clicked')}>
            View Details
          </Button>
          <Button variant="contained" size="small" onClick={() => console.log('Actions clicked')}>
            Actions
          </Button>
        </Box>
      }
      menuActions={[
        { label: 'Refresh Data', onClick: () => console.log('Refresh') },
        { label: 'Export', onClick: () => console.log('Export') },
      ]}
    >
      <ResilienceExpandedContent />
    </CustomInfoCard>
  );
};