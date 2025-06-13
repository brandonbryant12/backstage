import React from 'react';
import Box from '@mui/material/Box';
import { SkimMetric, SkimMetricProps } from './SkimMetric';

export interface SkimStatsProps {
  /** Array of metrics to display */
  metrics: Omit<SkimMetricProps, 'align'>[];
  /** Child box text alignment (default: 'left') */
  align?: 'left' | 'center' | 'right';
  /** Flex gap between boxes (default: 2) */
  gap?: number;
}

export const SkimStats = ({
  metrics,
  align = 'left',
  gap = 2,
}: SkimStatsProps) => (
  <Box sx={{ display: 'flex', width: '100%', gap }}>
    {metrics.map((metric, idx) => (
      <SkimMetric key={idx} {...metric} align={align} />
    ))}
  </Box>
);