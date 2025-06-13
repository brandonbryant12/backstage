import React, { ReactNode, useState, MouseEvent } from 'react';
import Button, { ButtonProps } from '@mui/material/Button';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';

interface DropdownAction {
  label: string;
  onClick: () => void;
  disabled?: boolean;
}

export interface CustomInfoCardDropdownButtonProps {
  label: string;
  actions: DropdownAction[];
  variant?: ButtonProps['variant'];
  color?: ButtonProps['color'];
  disabled?: boolean;
  children?: ReactNode;
}

export const CustomInfoCardDropdownButton = ({
  label,
  actions,
  variant = 'outlined',
  color = 'primary',
  disabled = false,
  children,
}: CustomInfoCardDropdownButtonProps) => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  const handleClick = (event: MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleActionClick = (action: DropdownAction) => {
    action.onClick();
    handleClose();
  };

  return (
    <>
      <Button
        variant={variant}
        color={color}
        disabled={disabled}
        onClick={handleClick}
        endIcon={<ArrowDropDownIcon />}
        aria-controls={Boolean(anchorEl) ? 'dropdown-menu' : undefined}
        aria-haspopup="true"
        aria-expanded={Boolean(anchorEl) ? 'true' : undefined}
      >
        {label}
      </Button>
      <Menu
        id="dropdown-menu"
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleClose}
        MenuListProps={{
          'aria-labelledby': 'dropdown-button',
        }}
      >
        {actions.map((action, index) => (
          <MenuItem
            key={`${action.label}-${index}`}
            onClick={() => handleActionClick(action)}
            disabled={action.disabled}
          >
            {action.label}
          </MenuItem>
        ))}
      </Menu>
      {children}
    </>
  );
}; 