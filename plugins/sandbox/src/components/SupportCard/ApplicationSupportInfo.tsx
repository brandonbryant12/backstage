import React from 'react';
import { ApplicationInfo } from './EntitySupportCard';
import Typography from '@material-ui/core/Typography';
import Grid from '@material-ui/core/Grid';
import Box from '@material-ui/core/Box';
import { MarkdownContent } from '@backstage/core-components';

interface ApplicationSupportInfoProps {
  applicationInfo: ApplicationInfo;
  supportInfo: string;
}

export const ApplicationSupportInfo = ({ applicationInfo, supportInfo }: ApplicationSupportInfoProps) => {
  const InfoCell = ({ title, value }: { title: string, value: string }) => (
    <Grid item xs={12} sm={6} md={4}>
      <Box mb={1}>
        <Typography variant="subtitle2" color="textSecondary">
          {title}
        </Typography>
        <Typography variant="body1">
          <strong>{value}</strong>
        </Typography>
      </Box>
    </Grid>
  );

  const ManagersCell = () => (
    <Grid item xs={12} sm={6} md={4}>
      <Box mb={1}>
        <Typography variant="subtitle2" color="textSecondary">
          MANAGERS
        </Typography>
        <Typography variant="body1">
          <strong>Development:</strong> {applicationInfo.appDevManager}
        </Typography>
        <Typography variant="body1">
          <strong>IT Prod. Manager:</strong> {applicationInfo.itProductManager}
        </Typography>
        <Typography variant="body1">
          <strong>Bus. Prod. Manager:</strong> {applicationInfo.businessProductManager}
        </Typography>
      </Box>
    </Grid>
  );

  return (
    <>
      {supportInfo && (
        <Grid item xs={12}>
          <MarkdownContent content={supportInfo} />
        </Grid>
      )}
      <Grid container spacing={3}>
        <InfoCell title="APP ID" value={applicationInfo.appId} />
        <InfoCell title="APP NAME" value={applicationInfo.appName} />
        <ManagersCell />
        <InfoCell title="CRITICALITY CODE" value={applicationInfo.criticalityCode} />
        <InfoCell title="RBF RATING" value={applicationInfo.rbfGovernedRating} />
        <InfoCell title="SECURITY TIER" value={applicationInfo.securityLevel} />
      </Grid>
    </>
  );
};
