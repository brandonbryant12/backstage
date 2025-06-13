import React from 'react';
import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import Typography from '@mui/material/Typography';
import { CustomInfoCard } from '../CustomInfoCard/CustomInfoCard';

export interface PreuseCardProps {
  title: React.ReactNode;
  skimContent?: React.ReactNode;
  dataSources?: string[];
  footerButtons?: React.ReactNode;
  children?: React.ReactNode;
}

/**
 * A collapsible card that hides its content by default.
 * @public
 */
export function PreuseCard({
  title,
  skimContent,
  dataSources,
  footerButtons,
  children,
}: PreuseCardProps) {
  const [expanded, setExpanded] = React.useState(false);

  const toggle = () => setExpanded(prev => !prev);

  const header = (
    <Box display="flex" alignItems="center" sx={{ flexGrow: 1 }}>
      <IconButton size="small" onClick={toggle} data-testid="toggle-button">
        {expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
      </IconButton>
      <Typography variant="h6" sx={{ ml: 1 }}>
        {title}
      </Typography>
      {!expanded && skimContent && (
        <Box sx={{ ml: 1, flexGrow: 1 }}>{skimContent}</Box>
      )}
    </Box>
  );

  return (
    <CustomInfoCard
      title={header}
      dataSources={expanded ? dataSources : undefined}
      footerButtons={footerButtons}
    >
      {expanded && children}
    </CustomInfoCard>
  );
}