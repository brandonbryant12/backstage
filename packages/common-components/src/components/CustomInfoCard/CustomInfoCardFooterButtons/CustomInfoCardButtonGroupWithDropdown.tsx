import React, { ReactNode } from 'react';
import Box from '@mui/material/Box';
import { ButtonProps } from '@mui/material/Button';
import { CustomInfoCardButtonGroup, CustomInfoCardButtonGroupProps } from './CustomInfoCardButtonGroup';
import { CustomInfoCardDropdownButton, CustomInfoCardDropdownButtonProps } from './CustomInfoCardDropdownButton';

export interface CustomInfoCardButtonGroupWithDropdownProps {
  children?: ReactNode;
  buttons?: Array<{
    label: string;
    onClick: () => void;
    variant?: ButtonProps['variant'];
    color?: ButtonProps['color'];
    disabled?: boolean;
  }>;
  dropdownButton?: {
    label: string;
    actions: Array<{
      label: string;
      onClick: () => void;
      disabled?: boolean;
    }>;
    variant?: ButtonProps['variant'];
    color?: ButtonProps['color'];
    disabled?: boolean;
  };
}

export const CustomInfoCardButtonGroupWithDropdown = ({
  children,
  buttons = [],
  dropdownButton,
}: CustomInfoCardButtonGroupWithDropdownProps) => {
  return (
    <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
      {buttons.length > 0 && (
        <CustomInfoCardButtonGroup buttons={buttons} />
      )}
      {dropdownButton && (
        <CustomInfoCardDropdownButton
          label={dropdownButton.label}
          actions={dropdownButton.actions}
          variant={dropdownButton.variant}
          color={dropdownButton.color}
          disabled={dropdownButton.disabled}
        />
      )}
      {children}
    </Box>
  );
}; 