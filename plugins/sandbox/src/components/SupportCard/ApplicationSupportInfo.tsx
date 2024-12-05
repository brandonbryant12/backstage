import React from 'react';
import { ApplicationInfo } from './SupportCard';
import { Grid, Typography, Box } from '@material-ui/core';
import { MarkdownContent } from '@backstage/core-components';

interface Props {
  applicationInfo: ApplicationInfo;
  supportInfo?: string;
}

export const ApplicationSupportInfo: React.FC<Props> = ({ applicationInfo, supportInfo }) => {
  return (
    <Box>
      {supportInfo && (
        <Box mb={2}>
          <MarkdownContent content={supportInfo} />
        </Box>
      )}
      
      <Grid container spacing={2}>
        <Grid item xs={4}>
          <Typography variant="subtitle2" color="textSecondary">APP ID</Typography>
          <Typography variant="body1" style={{ fontWeight: 'bold' }}>{applicationInfo.appId}</Typography>
        </Grid>
        
        <Grid item xs={4}>
          <Typography variant="subtitle2" color="textSecondary">APP NAME</Typography>
          <Typography variant="body1" style={{ fontWeight: 'bold' }}>{applicationInfo.appName}</Typography>
        </Grid>
        
        <Grid item xs={4}>
          <Typography variant="subtitle2" color="textSecondary">MANAGERS</Typography>
          <Typography>Development: {applicationInfo.appDevManager}</Typography>
          <Typography>IT Prod. Manager: {applicationInfo.itProductManager}</Typography>
          <Typography>Bus. Prod. Manager: {applicationInfo.businessProductManager}</Typography>
        </Grid>
        
        <Grid item xs={4}>
          <Typography variant="subtitle2" color="textSecondary">CRITICALITY CODE</Typography>
          <Typography>{applicationInfo.criticalityCode}</Typography>
        </Grid>
        
        <Grid item xs={4}>
          <Typography variant="subtitle2" color="textSecondary">RBF RATING</Typography>
          <Typography>{applicationInfo.rbfGovernedRating}</Typography>
        </Grid>
        
        <Grid item xs={4}>
          <Typography variant="subtitle2" color="textSecondary">SECURITY TIER</Typography>
          <Typography>{applicationInfo.securityLevel}</Typography>
        </Grid>
      </Grid>
    </Box>
  );
};
