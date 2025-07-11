import React, { ReactNode } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { useTheme } from '@mui/material/styles';

export interface SkimMetricProps {
  label: ReactNode;
  value?: ReactNode;
  isError?: boolean;
  color?: 'primary' | 'secondary' | 'error' | 'warning' | 'info' | 'success';
  /** Text alignment inside the box (default: 'left') */
  align?: 'left' | 'center' | 'right';
}

export const SkimMetric = ({
  label,
  value,
  isError,
  color,
  align = 'left',
}: SkimMetricProps) => {
  const theme = useTheme();

  const bgColor = theme.palette.background.default;
  const valueColor = theme.palette.text.primary;

  let displayValue: ReactNode;
  let displayColor = valueColor;
  if (isError) {
    displayValue = 'Error!';
    displayColor = theme.palette.error.main;
  } else if (value == null) {
    displayValue = 'N/A';
    displayColor = theme.palette.text.secondary;
  } else {
    displayValue = value;
  }

  if (color) {
    displayColor = theme.palette[color].main;
  }

  return (
    <Box
      sx={{
        flex: '1 1 0',
        minWidth: '120px',
        p: 1,
        borderRadius: 2,
        backgroundColor: bgColor,
        textAlign: align,
      }}
    >
      <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
        {label}
      </Typography>
      <Typography variant="h4" sx={{ color: displayColor, fontWeight: 600 }}>
        {displayValue}
      </Typography>
    </Box>
  );
};