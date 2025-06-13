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

import { CustomInfoCardButtonGroup } from './CustomInfoCardFooterButtons/CustomInfoCardButtonGroup';
import { CustomInfoCardDropdownButton } from './CustomInfoCardFooterButtons/CustomInfoCardDropdownButton';
import { CustomInfoCardButtonGroupWithDropdown } from './CustomInfoCardFooterButtons/CustomInfoCardButtonGroupWithDropdown';

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
  },
  [`& .${classes.titleText}`]: {
    whiteSpace: 'nowrap',
    fontSize: '1.5rem',
    fontWeight: 700,
    padding: '0 32px',
  },
  [`& .${classes.cardHeader}`]: {
    height: `${cardHeaderFooterHeight}px`,
    padding: '20px',
    '& .MuiCardHeader-content': {
      overflow: 'hidden',
    },
  },
  [`& .${classes.cardContent}`]: {
    padding: '20px',
  },
  [`& .${classes.cardSources}`]: {
    display: 'flex',
    alignItems: 'center',
    fontSize: '1.125rem',
    fontWeight: 'normal',
    color: theme.palette.text.secondary,
  },
  [`& .${classes.cardSubHeader}`]: {
    padding: '20px 20px 0 20px',
    fontSize: '1.125rem',
    color: theme.palette.text.secondary,
  },
  [`& .${classes.cardFooter}`]: {
    height: `${cardHeaderFooterHeight}px`,
    padding: '20px',
    justifyContent: 'flex-end',
  },
  [`& .${classes.cardSkimContent}`]: {
    padding: '0 20px 8px 20px',
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
}: CustomInfoCardProps) => {
  const [expanded, setExpanded] = useState(true);
  const handleExpandClick = () => {
    setExpanded(prev => !prev);
  };

  return (
    <StyledCard hasFooter={!!footerButtons} className={classes.cardWrapper}>
      <CardHeader
        className={classes.cardHeader}
        title={
          <Box className={classes.titleWrapper}>
            <IconButton
              aria-label={expanded ? 'collapse' : 'expand'}
              onClick={handleExpandClick}
              sx={{
                transform: expanded ? 'rotate(0deg)' : 'rotate(-90deg)',
                transition: 'transform 150ms',
                mr: 1,
              }}
            >
              <ExpandMoreIcon />
            </IconButton>
            <Typography className={classes.titleText}>{title}</Typography>
            {dataSources.length > 0 && <DataSourceList {...{ dataSources }} />}
          </Box>
        }
        action={
          menuActions.length > 0 ? (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <MenuDropdown {...{ menuActions }} />
            </Box>
          ) : null
        }
      />
      {!expanded && skimContent && (
        <Box className={classes.cardSkimContent}>{skimContent}</Box>
      )}
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