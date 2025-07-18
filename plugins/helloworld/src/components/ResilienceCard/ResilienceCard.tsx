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

const ChaosExperimentSection = () => {
  const { chaosExperiment } = useResilienceData();
  
  return (
    <Box sx={{ 
      bgcolor: 'background.default', 
      p: 2, 
      borderRadius: (theme) => theme.shape.borderRadius, 
      height: '100%', 
      width: '100%', 
      display: 'flex', 
      flexDirection: 'column' 
    }}>
      <Typography variant="h6" sx={{ mb: 2, color: 'text.primary', fontWeight: 'bold', fontSize: '1rem' }}>
        CHAOS EXPERIMENT
      </Typography>
      <Box sx={{ 
        display: 'flex', 
        flexDirection: 'column', 
        gap: 0.5, 
        flex: 1, 
        justifyContent: 'center',
        width: '100%'
      }}>
        <Box sx={{ 
          display: 'grid', 
          gridTemplateColumns: 'auto auto', 
          gap: 2, 
          alignItems: 'center',
          width: '100%'
        }}>
          <Typography variant="body1" sx={{ color: 'text.secondary', textAlign: 'right' }}>
            Chaos Experiments Compliant:
          </Typography>
          <Typography variant="body1" sx={{ fontWeight: 'bold', textAlign: 'left' }}>
            {chaosExperiment.compliant ? 'Yes' : 'No'}
          </Typography>
          
          <Typography variant="body1" sx={{ color: 'text.secondary', textAlign: 'right' }}>
            In Scope:
          </Typography>
          <Typography variant="body1" sx={{ fontWeight: 'bold', textAlign: 'left' }}>
            {chaosExperiment.inScope ? 'Yes' : 'No'}
          </Typography>
          
          <Typography variant="body1" sx={{ color: 'text.secondary', textAlign: 'right' }}>
            Catchup Date:
          </Typography>
          <Typography variant="body1" sx={{ fontWeight: 'bold', textAlign: 'left' }}>
            {chaosExperiment.catchupDate}
          </Typography>
          
          <Typography variant="body1" sx={{ color: 'text.secondary', textAlign: 'right' }}>
            Snapshot Facing Date:
          </Typography>
          <Typography variant="body1" sx={{ fontWeight: 'bold', textAlign: 'left' }}>
            {chaosExperiment.snapshotFacingDate || 'NO'}
          </Typography>
        </Box>
      </Box>
    </Box>
  );
};

const IncidentManagementSection = () => {
  const { incidents } = useResilienceData();
  
  return (
    <Box sx={{ 
      bgcolor: 'background.default', 
      p: 2, 
      borderRadius: (theme) => theme.shape.borderRadius, 
      height: '100%', 
      width: '100%', 
      display: 'flex', 
      flexDirection: 'column' 
    }}>
      <Typography variant="h6" sx={{ mb: 2, color: 'text.primary', fontWeight: 'bold', fontSize: '1rem' }}>
        INCIDENT MANAGEMENT
      </Typography>
      <Box sx={{ 
        display: 'flex', 
        gap: 1, 
        flexWrap: 'wrap', 
        width: '100%', 
        flex: 1, 
        justifyContent: 'space-between', 
        alignItems: 'center' 
      }}>
        <Box sx={{ 
          bgcolor: 'error.main', 
          color: 'common.white', 
          px: 2, 
          py: 1.5, 
          borderRadius: (theme) => theme.shape.borderRadius, 
          textAlign: 'center', 
          fontSize: '1rem', 
          fontWeight: 'bold', 
          flex: 1, 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center' 
        }}>
          Critical {incidents.critical}
        </Box>
        <Box sx={{ 
          bgcolor: 'warning.dark', 
          color: 'common.white', 
          px: 2, 
          py: 1.5, 
          borderRadius: (theme) => theme.shape.borderRadius, 
          textAlign: 'center', 
          fontSize: '1rem', 
          fontWeight: 'bold', 
          flex: 1, 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center' 
        }}>
          High {incidents.high}
        </Box>
        <Box sx={{ 
          bgcolor: 'warning.main', 
          color: 'common.white', 
          px: 2, 
          py: 1.5, 
          borderRadius: (theme) => theme.shape.borderRadius, 
          textAlign: 'center', 
          fontSize: '1rem', 
          fontWeight: 'bold', 
          flex: 1, 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center' 
        }}>
          Medium {incidents.medium}
        </Box>
        <Box sx={{ 
          bgcolor: 'info.main', 
          color: 'common.white', 
          px: 2, 
          py: 1.5, 
          borderRadius: (theme) => theme.shape.borderRadius, 
          textAlign: 'center', 
          fontSize: '1rem', 
          fontWeight: 'bold', 
          flex: 1, 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center' 
        }}>
          Low & Below {incidents.low}
        </Box>
      </Box>
    </Box>
  );
};

const ResilienceExpandedContent = () => {
  return (
    <Box sx={{ 
      display: 'flex', 
      gap: 2, 
      width: '100%', 
      height: '100%',
      minHeight: 0, // This ensures flex children can shrink/grow properly
    }}>
      <Box sx={{ 
        flex: 1, 
        minHeight: 0, // Allow flex item to shrink
        display: 'flex',
        flexDirection: 'column'
      }}>
        <ChaosExperimentSection />
      </Box>
      <Box sx={{ 
        flex: 1, 
        minHeight: 0, // Allow flex item to shrink
        display: 'flex',
        flexDirection: 'column'
      }}>
        <IncidentManagementSection />
      </Box>
    </Box>
  );
};

export const ResilienceCard = () => {
  return (
    <CustomInfoCard
      title="Resilience"
      dataSources={['Chaos Experiment', 'Incident Management']}
      skimContent={<ResilienceSkimContent />}
      footerButtonsComponent={
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button variant="outlined" size="small" onClick={() => { /* TODO: Implement view details */ }}>
            View Details
          </Button>
          <Button variant="contained" size="small" onClick={() => { /* TODO: Implement actions */ }}>
            Actions
          </Button>
        </Box>
      }
      menuActions={[
        { label: 'Refresh Data', onClick: () => { /* TODO: Implement refresh */ } },
        { label: 'Export', onClick: () => { /* TODO: Implement export */ } },
      ]}
    >
      <ResilienceExpandedContent />
    </CustomInfoCard>
  );
};