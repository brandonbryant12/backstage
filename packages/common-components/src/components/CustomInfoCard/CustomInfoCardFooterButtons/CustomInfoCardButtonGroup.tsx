import React, { ReactNode } from 'react';
import Box from '@mui/material/Box';
import Button, { ButtonProps } from '@mui/material/Button';

export interface CustomInfoCardButtonGroupProps {
  children?: ReactNode;
  buttons?: Array<{
    label: string;
    onClick: () => void;
    variant?: ButtonProps['variant'];
    color?: ButtonProps['color'];
    disabled?: boolean;
  }>;
}

export const CustomInfoCardButtonGroup = ({
  children,
  buttons = [],
}: CustomInfoCardButtonGroupProps) => {
  return (
    <Box sx={{ display: 'flex', gap: 1 }}>
      {buttons.map((button, index) => (
        <Button
          key={`${button.label}-${index}`}
          variant={button.variant || 'outlined'}
          color={button.color || 'primary'}
          disabled={button.disabled}
          onClick={button.onClick}
        >
          {button.label}
        </Button>
      ))}
      {children}
    </Box>
  );
}; 