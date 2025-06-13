import React, { ReactNode } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { useTheme } from '@mui/material/styles';

export interface SkimMetricProps {
  label: ReactNode;
  value: ReactNode;
  /** Text alignment inside the box (default: 'left') */
  align?: 'left' | 'center' | 'right';
}

export const SkimMetric = ({
  label,
  value,
  align = 'left',
}: SkimMetricProps) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  const bgColor = isDark ? theme.palette.grey[800] : theme.palette.grey[100];
  const valueColor = isDark ? theme.palette.common.white : theme.palette.text.primary;

  return (
    <Box
      sx={{
        width: '100%',
        p: 2,
        borderRadius: 2,
        backgroundColor: bgColor,
        textAlign: align,
      }}
    >
      <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
        {label}
      </Typography>
      <Typography variant="h4" sx={{ color: valueColor, fontWeight: 600 }}>
        {value}
      </Typography>
    </Box>
  );
};