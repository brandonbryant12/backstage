import React from 'react';
import { ApplicationInfo } from './EntitySupportCard';
import Grid from '@material-ui/core/Grid';
import { MarkdownContent } from '@backstage/core-components';
import { AboutField } from '@backstage/plugin-catalog';
import Typography from '@material-ui/core/Typography';

interface ApplicationSupportInfoProps {
  applicationInfo: ApplicationInfo;
  supportInfo: string;
}

export const ApplicationSupportInfo = ({ applicationInfo, supportInfo }: ApplicationSupportInfoProps) => {
  return (
    <>
      {supportInfo && (
        <Grid item xs={12}>
          <MarkdownContent content={supportInfo} />
        </Grid>
      )}
      <Grid container spacing={3}>
        <AboutField label="App ID" value={applicationInfo.appId} gridSizes={{ xs: 12, sm: 6, md: 4 }} />
        <AboutField label="App Name" value={applicationInfo.appName} gridSizes={{ xs: 12, sm: 6, md: 4 }} />
        
        <AboutField 
          label="Managers" 
          gridSizes={{ xs: 12, sm: 6, md: 4 }}
        >
          <Typography variant="body2">
            <strong>Development:</strong> {applicationInfo.appDevManager}<br />
            <strong>IT Prod. Manager:</strong> {applicationInfo.itProductManager}<br />
            <strong>Bus. Prod. Manager:</strong> {applicationInfo.businessProductManager}
          </Typography>
        </AboutField>

        <AboutField 
          label="Criticality Code" 
          value={applicationInfo.criticalityCode} 
          gridSizes={{ xs: 12, sm: 6, md: 4 }} 
        />
        <AboutField 
          label="RBF Rating" 
          value={applicationInfo.rbfGovernedRating} 
          gridSizes={{ xs: 12, sm: 6, md: 4 }} 
        />
        <AboutField 
          label="Security Tier" 
          value={applicationInfo.securityLevel} 
          gridSizes={{ xs: 12, sm: 6, md: 4 }} 
        />
      </Grid>
    </>
  );
};
