import React from 'react';
import { useEntity } from '@backstage/plugin-catalog-react';
import { useApi, configApiRef } from '@backstage/core-plugin-api';
import { Alert } from '@backstage/core-components';
import { useLocation } from 'react-router-dom';
import { Link } from '@backstage/core-components';

export const ServicenowDeprecationBanner = () => {
  const { entity } = useEntity();
  const config = useApi(configApiRef);
  const location = useLocation();

  const shouldShowBanner = 
    entity.metadata.namespace === 'servicenow' && 
    config.getBoolean('entityAggregator.provider.enabled', false);

  if (!shouldShowBanner) return null;

  const newPath = location.pathname.replace(/servicenow/gi, 'default') + location.search;

  return (
    <Alert severity="warning" data-testid="servicenow-deprecation-banner">
      servicenow namespace deprecated please use the default namespace.{' '}
      <Link to={newPath}>Switch to default namespace</Link>
    </Alert>
  );
};