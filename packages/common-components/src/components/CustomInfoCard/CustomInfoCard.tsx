import React from 'react';
import Card from '@mui/material/Card';
import CardHeader from '@mui/material/CardHeader';
import CardContent from '@mui/material/CardContent';
import CardActions from '@mui/material/CardActions';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';

export interface CustomInfoCardProps {
  title: React.ReactNode;
  dataSources?: string[];
  footerButtons?: React.ReactNode;
  children?: React.ReactNode;
}

/**
 * A reusable info card with optional data sources display and footer buttons.
 * @public
 */
export function CustomInfoCard(props: CustomInfoCardProps) {
  const { title, dataSources = [], footerButtons, children } = props;

  const dataSourceText = dataSources.join(' | ');

  const header = (
    <Box display="flex" alignItems="center">
      {React.isValidElement(title) ? (
        title
      ) : (
        <Typography variant="h6">{title}</Typography>
      )}
      {dataSourceText && (
        <Typography
          variant="subtitle2"
          color="text.secondary"
          sx={{ ml: 1 }}
        >
          | {dataSourceText}
        </Typography>
      )}
    </Box>
  );

  return (
    <Card>
      <CardHeader title={header} />
      <CardContent>{children}</CardContent>
      {footerButtons && (
        <CardActions sx={{ justifyContent: 'flex-end' }}>
          {footerButtons}
        </CardActions>
      )}
    </Card>
  );
}