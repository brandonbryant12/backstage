import React, {
  ReactElement,
  type ReactNode,
  type MouseEvent,
  Fragment,
  useState,
} from 'react';

import Box from '@mui/material/Box';
import Card, { CardProps } from '@mui/material/Card';
import CardActions from '@mui/material/CardActions';
import CardContent from '@mui/material/CardContent';
import CardHeader from '@mui/material/CardHeader';
import Divider from '@mui/material/Divider';
import IconButton from '@mui/material/IconButton';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import Typography from '@mui/material/Typography';
import { styled } from '@mui/material/styles';
import Collapse from '@mui/material/Collapse';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { Link as RouterLink } from 'react-router-dom';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import UnfoldMoreIcon from '@mui/icons-material/UnfoldMore';
import UnfoldLessIcon from '@mui/icons-material/UnfoldLess';

import ErrorIcon from '@mui/icons-material/Error';
import WarningIcon from '@mui/icons-material/Warning';
import Tooltip from '@mui/material/Tooltip';

import { CustomInfoCardButtonGroup } from './CustomInfoCardFooterButtons/CustomInfoCardButtonGroup';
import { CustomInfoCardDropdownButton } from './CustomInfoCardFooterButtons/CustomInfoCardDropdownButton';
import { CustomInfoCardButtonGroupWithDropdown } from './CustomInfoCardFooterButtons/CustomInfoCardButtonGroupWithDropdown';
import { SkimContentErrorState } from './SkimContentErrorState';

const PREFIX = 'CustomInfoCard';

interface StyledCardProps extends CardProps {
  hasFooter: boolean;
}

const classes = {
  separator: `${PREFIX}-separator`,
  titleWrapper: `${PREFIX}-titleWrapper`,
  titleText: `${PREFIX}-titleText`,
  cardWrapper: `${PREFIX}-cardWrapper`,
  cardHeader: `${PREFIX}-cardHeader`,
  cardContent: `${PREFIX}-cardContent`,
  cardSources: `${PREFIX}-cardSources`,
  cardSubHeader: `${PREFIX}-cardSubHeader`,
  cardFooter: `${PREFIX}-cardFooter`,
  cardSkimContent: `${PREFIX}-cardSkimContent`,
};

const cardHeaderFooterHeight = 84;

const StyledCard = styled(({ hasFooter, ...otherProps }: StyledCardProps) => (
  <Card {...otherProps} />
))<StyledCardProps>(({ theme }) => ({
  [`& .${classes.separator}`]: {
    margin: '0 8px',
  },
  [`& .${classes.titleWrapper}`]: {
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing(1),
    padding: '8px 16px', // Added padding around title wrapper
  },
  [`& .${classes.titleText}`]: {
    whiteSpace: 'nowrap',
    fontSize: '1.5rem',
    fontWeight: 700,
    padding: 0,
  },
  [`& .${classes.cardHeader}`]: {
    padding: '8px 16px',
    '& .MuiCardHeader-content': {
      overflow: 'hidden',
    },
  },
  [`& .${classes.cardContent}`]: {
    padding: '24px 20px', // Increased padding for content
  },
  [`& .${classes.cardSources}`]: {
    display: 'flex',
    alignItems: 'center',
    fontSize: '1.125rem',
    fontWeight: 'normal',
    color: theme.palette.text.secondary,
    padding: '0 8px', // Added padding for data sources
  },
  [`& .${classes.cardSubHeader}`]: {
    padding: '16px 20px 0 20px', // Adjusted subheader padding
    fontSize: '1.125rem',
    color: theme.palette.text.secondary,
  },
  [`& .${classes.cardFooter}`]: {
    height: `${cardHeaderFooterHeight}px`,
    padding: '16px 20px', // Adjusted footer padding
    justifyContent: 'flex-end',
  },
  [`& .${classes.cardSkimContent}`]: {
    padding: '8px 20px', // Adjusted skim content padding
  },
}));

interface MenuAction {
  label: string;
  onClick: () => void;
}

type AllowedFooterButtonComponents =
  | ReactElement<typeof CustomInfoCardButtonGroup>
  | ReactElement<typeof CustomInfoCardDropdownButton>
  | ReactElement<typeof CustomInfoCardButtonGroupWithDropdown>;

export interface CustomInfoCardProps {
  title: ReactNode;
  subheader?: ReactNode;
  children: ReactNode;
  footerButtonsComponent?: AllowedFooterButtonComponents;
  dataSources?: string[];
  menuActions?: MenuAction[];
  skimContent?: ReactNode;
  skimContentError?: boolean;
  /** Optional path to a "deep-dive" page */
  deepDivePath?: string;
  errorMessage?: string;
  warningMessage?: string;
  /** Show or hide the width-toggle button (AdaptiveGrid sets this) */
  showWidthToggle?: boolean;
  /** Current width state (half / full) */
  isFullWidth?: boolean;
  /** Callback fired when user clicks width-toggle */
  onToggleWidth?: () => void;
}

const MenuDropdown = ({ menuActions }: { menuActions: MenuAction[] }) => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  const handleMenuOpen = (event: MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => setAnchorEl(null);

  return (
    <>
      <IconButton aria-label="settings" onClick={handleMenuOpen}>
        <MoreVertIcon />
      </IconButton>
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        {menuActions.map((action, index) => (
          <MenuItem
            key={`${action.label}-${index}`}
            onClick={() => {
              action.onClick();
              handleMenuClose();
            }}
          >
            {action.label}
          </MenuItem>
        ))}
      </Menu>
    </>
  );
};

const DataSourceList = ({ dataSources }: { dataSources: string[] }) => (
  <Box className={classes.cardSources}>
    <Typography className={classes.separator}>|</Typography>
    {dataSources.map((dataSource, index) => (
      <Fragment key={`${dataSource}-${index}`}>
        {index > 0 && (
          <Typography className={classes.separator}>|</Typography>
        )}
        <Typography style={{ whiteSpace: 'nowrap' }}>
          {dataSource}
        </Typography>
      </Fragment>
    ))}
  </Box>
);

const Footer = ({
  footerButtons,
}: {
  footerButtons: AllowedFooterButtonComponents;
}) => (
  <>
    <Divider />
    <CardActions className={classes.cardFooter}>
      <Box sx={{ marginLeft: 'auto' }}>{footerButtons}</Box>
    </CardActions>
  </>
);

export const CustomInfoCard = ({
  title,
  subheader,
  children,
  dataSources = [],
  footerButtonsComponent: footerButtons,
  menuActions = [],
  skimContent,
  skimContentError = false,
  deepDivePath,
  errorMessage,
  warningMessage,
  showWidthToggle = false,
  isFullWidth = false,
  onToggleWidth,
}: CustomInfoCardProps) => {
  const [expanded, setExpanded] = useState(true);
  const handleExpandClick = () => {
    setExpanded(prev => !prev);
  };

  let statusIcon = null;
  if (errorMessage) {
    statusIcon = (
      <Tooltip title={errorMessage}>
        <ErrorIcon color="error" sx={{ mr: 0.5, verticalAlign: 'middle' }} />
      </Tooltip>
    );
  } else if (warningMessage) {
    statusIcon = (
      <Tooltip title={warningMessage}>
        <WarningIcon color="warning" sx={{ mr: 0.5, verticalAlign: 'middle' }} />
      </Tooltip>
    );
  }

  return (
    <StyledCard hasFooter={!!footerButtons} className={classes.cardWrapper}>
      <CardHeader
        className={`${classes.cardHeader} custom-info-card-drag-handle`}
        title={
          <Box className={classes.titleWrapper}>
            <IconButton
              aria-label={expanded ? 'collapse' : 'expand'}
              onClick={handleExpandClick}
              sx={{
                transform: expanded ? 'rotate(0deg)' : 'rotate(-90deg)',
                transition: 'transform 150ms',
                mr: 0,
              }}
            >
              <ExpandMoreIcon />
            </IconButton>
            {statusIcon}
            <Typography className={classes.titleText}>{title}</Typography>
            {expanded ? (
              dataSources.length > 0 && <DataSourceList dataSources={dataSources} />
            ) : (
              (skimContent || skimContentError) && (
                <Box sx={{ flex: 1, ml: 2 }}>
                  {skimContentError ? <SkimContentErrorState /> : skimContent}
                </Box>
              )
            )}
          </Box>
        }
        action={
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {showWidthToggle && (
              <IconButton
                aria-label="toggle-width"
                onClick={onToggleWidth}
                size="small"
              >
                {isFullWidth ? (
                  <UnfoldLessIcon fontSize="small" />
                ) : (
                  <UnfoldMoreIcon fontSize="small" />
                )}
              </IconButton>
            )}
            {deepDivePath && (
              <IconButton
                component={RouterLink}
                to={deepDivePath}
                aria-label="deep-dive"
              >
                <OpenInNewIcon fontSize="small" />
              </IconButton>
            )}
            {menuActions.length > 0 && <MenuDropdown {...{ menuActions }} />}
          </Box>
        }
      />
      <Divider />
      <Collapse in={expanded} timeout="auto" unmountOnExit>
        {subheader && (
          <Typography className={classes.cardSubHeader}>{subheader}</Typography>
        )}
        <CardContent className={classes.cardContent}>{children}</CardContent>
        {footerButtons && <Footer {...{ footerButtons }} />}
      </Collapse>
    </StyledCard>
  );
};