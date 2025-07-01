import React from 'react';
import { useAsyncEntity } from '@backstage/plugin-catalog-react';
import { Progress, ResponseErrorPanel } from '@backstage/core-components';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Chip from '@mui/material/Chip';
import Avatar from '@mui/material/Avatar';
import { Entity } from '@backstage/catalog-model';

export interface EntityHeaderProps {
  /** Override default title (entity title or name) */
  title?: React.ReactNode;
  /** Optional subtitle shown under the title */
  subtitle?: React.ReactNode;
  /** Optional right-aligned actions (buttons, menus …) */
  actions?: React.ReactNode;
  /** Explicit entity (skips hook if provided) */
  entity?: Entity;
}

/**
 * Minimal fork of Backstage's EntityHeader.
 * Shows avatar, title, kind chip and optional actions.
 */
export const EntityHeader = ({
  title,
  subtitle,
  actions,
  entity: propEntity,
}: EntityHeaderProps) => {
  const { entity: ctxEntity, loading, error } = useAsyncEntity();

  const entity = propEntity ?? ctxEntity;

  if (!entity) {
    // if caller didn't supply entity and context still loading/error
    if (loading) return <Progress />;
    if (error) return <ResponseErrorPanel error={error} />;
    return null;
  }

  // no loader when propEntity is present (assumed resolved)

  const displayTitle =
    title ?? entity.metadata.title ?? entity.metadata.name;
  const kind = entity.kind.toLocaleLowerCase('en-US');

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
      <Avatar sx={{ mr: 2 }}>
        {displayTitle?.toString().charAt(0).toUpperCase()}
      </Avatar>

      <Box sx={{ flex: 1 }}>
        <Typography variant="h4">{displayTitle}</Typography>
        {subtitle && (
          <Typography variant="subtitle1" color="textSecondary">
            {subtitle}
          </Typography>
        )}
        <Chip
          label={kind}
          size="small"
          sx={{ mt: 0.5, textTransform: 'uppercase' }}
        />
      </Box>

      {actions && <Box sx={{ ml: 2 }}>{actions}</Box>}
    </Box>
  );
};