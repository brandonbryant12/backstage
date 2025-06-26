import React from 'react';
import Box from '@mui/material/Box';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import { useTheme } from '@mui/material/styles';

export const SkimContentErrorState = () => {
  const theme = useTheme();
  
  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'flex-end',
        alignItems: 'center',
        opacity: 0.6,
      }}
    >
      <ErrorOutlineIcon
        sx={{
          fontSize: '1rem',
          color: theme.palette.error.main,
        }}
      />
    </Box>
  );
};