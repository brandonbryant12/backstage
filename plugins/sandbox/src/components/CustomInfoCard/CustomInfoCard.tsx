import React, { useState, ReactNode } from 'react';
import Box from '@material-ui/core/Box';
import Card from '@material-ui/core/Card';
import CardHeader from '@material-ui/core/CardHeader';
import CardContent from '@material-ui/core/CardContent';
import CardActions from '@material-ui/core/CardActions';
import Button from '@material-ui/core/Button';
import Menu from '@material-ui/core/Menu';
import MenuItem from '@material-ui/core/MenuItem';
import Typography from '@material-ui/core/Typography';
import { Theme } from '@material-ui/core';
import { useTheme } from '@material-ui/core/styles';
import KeyboardArrowDownIcon from '@material-ui/icons/KeyboardArrowDown';
import { HeaderActionMenu } from '@backstage/core-components';
import { makeStyles } from '@material-ui/core/styles';

const useStyles = makeStyles((_: Theme) => ({
  separator: {
    color: ({ isDark }: { isDark: boolean }) => 
      isDark ? '#FFFFFF' : '#000000',
  },
  cardContent: {
    flexGrow: 1,
    overflowY: 'auto',
    fontSize: '16px',
  },
  cardHeader: {
    '& .MuiCardHeader-content': {
      overflow: 'hidden',
    },
    '& .MuiCardHeader-subheader': {
      color: ({ isDark }: { isDark: boolean }) =>
        isDark ? '#B6B6B6' : '#5C5C5C',
    },
  },
  sourceText: {
    fontSize: '18px',
    fontWeight: 'normal',
    color: ({ isDark }: { isDark: boolean }) =>
      isDark ? '#B6B6B6' : '#5C5C5C',
  }
}));

interface DataSource {
  source: string;
  name: string;
}

interface MenuAction {
  label: string;
  onClick: () => void;
}

export interface CustomInfoCardProps {
  title: React.ReactNode;
  subheader?: React.ReactNode;
  children: ReactNode;
  dataSources?: DataSource[];
  menuActions?: MenuAction[];
}

export const CustomInfoCard = ({
  title,
  subheader,
  children,
  dataSources = [],
  menuActions = [],
}: CustomInfoCardProps) => {
  const theme = useTheme();
  const isDarkTheme = theme?.palette?.type === 'dark';
  const classes = useStyles({ isDark: isDarkTheme });
  const borderColor = isDarkTheme ? '#FFFFFF' : '#000000';
  const [sourceMenuAnchor, setSourceMenuAnchor] = useState<null | HTMLElement>(null);

  const handleSourceMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setSourceMenuAnchor(event.currentTarget);
  };

  const handleSourceMenuClose = () => {
    setSourceMenuAnchor(null);
  };

  const menuItems = menuActions.map(action => ({
    label: action.label,
    onClick: action.onClick,
  }));

  const renderDataSourceNames = () => {
    if (!dataSources.length) return null;
    return (
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
        }}
      >
        <Typography className={classes.separator}>|</Typography>
        {dataSources.map((source, index) => (
          <React.Fragment key={source.name}>
            {index > 0 && (
              <Typography className={classes.separator}>|</Typography>
            )}
            <Typography className={classes.sourceText}>
              {source.name}
            </Typography>
          </React.Fragment>
        ))}
      </Box>
    );
  };

  const renderSourceButton = () => {
    if (!dataSources.length) return null;
    
    const buttonStyle = {
      padding: theme.spacing(0.75, 2),
      borderRadius: theme.shape.borderRadius,
      backgroundColor: isDarkTheme ? '#e8e8e8' : theme.palette.primary.main,
      color: isDarkTheme ? '#000000' : theme.palette.primary.contrastText,
    };
    
    if (dataSources.length === 1) {
      return (
        <Button
          variant="contained"
          onClick={() => window.open(dataSources[0].source, '_blank')}
          style={buttonStyle}
        >
          GO TO {dataSources[0].name.toUpperCase()}
        </Button>
      );
    }

    return (
      <>
        <Button
          variant="contained"
          endIcon={<KeyboardArrowDownIcon />}
          onClick={handleSourceMenuOpen}
          style={buttonStyle}
        >
          SOURCES
        </Button>
        <Menu
          anchorEl={sourceMenuAnchor}
          open={Boolean(sourceMenuAnchor)}
          onClose={handleSourceMenuClose}
        >
          {dataSources.map((source, index) => (
            <MenuItem 
              key={index}
              onClick={() => {
                window.open(source.source, '_blank');
                handleSourceMenuClose();
              }}
            >
              {source.name}
            </MenuItem>
          ))}
        </Menu>
      </>
    );
  };

  return (
    <Card style={{
      border: `1px solid ${borderColor}`,
      borderRadius: theme.shape.borderRadius,
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      maxWidth: 790,
    }}>
      <CardHeader
        className={classes.cardHeader}
        style={{
          borderBottom: `1px solid ${borderColor}`,
          height: '84px',
          padding: theme.spacing(2.5, 3),
        }}
        title={
          <Box sx={{
            display: 'flex',
            alignItems: 'center',
          }}>
            <Typography>
              {title}
            </Typography>
            {renderDataSourceNames()}
          </Box>
        }
        subheader={subheader}
        action={menuActions.length > 0 ? <HeaderActionMenu actionItems={menuItems} /> : null}
      />

      <CardContent className={classes.cardContent}>
        {children}
      </CardContent>

      <CardActions style={{
        borderTop: `1px solid ${borderColor}`,
        height: '84px',
        padding: theme.spacing(3),
        justifyContent: 'flex-end',
      }}>
        <Box sx={{ marginLeft: 'auto' }}>
          {renderSourceButton()}
        </Box>
      </CardActions>
    </Card>
  );
};