import React from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { styled } from '@mui/material/styles';
import ReactPlayer from 'react-player';

export interface VideoProps {
  uri: string;
  title?: string;
  description?: string;
  thumbnailUri?: string;
  onPlay?: () => void;
  onPause?: () => void;
  onEnded?: () => void;
  onError?: (error: any) => void;
  onProgress?: (state: { played: number; playedSeconds: number; loaded: number; loadedSeconds: number }) => void;
  width?: string | number;
  height?: string | number;
  controls?: boolean;
  playing?: boolean;
  loop?: boolean;
  muted?: boolean;
  volume?: number;
  playbackRate?: number;
}

const PREFIX = 'Video';

const classes = {
  container: `${PREFIX}-container`,
  videoWrapper: `${PREFIX}-videoWrapper`,
  video: `${PREFIX}-video`,
  infoWrapper: `${PREFIX}-infoWrapper`,
  title: `${PREFIX}-title`,
  description: `${PREFIX}-description`,
};

const StyledBox = styled(Box)(({ theme }) => ({
  [`&.${classes.container}`]: {
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing(2),
    width: '100%',
  },

  [`& .${classes.videoWrapper}`]: {
    position: 'relative',
    width: '100%',
    paddingTop: '56.25%', // 16:9 aspect ratio
    backgroundColor: theme.palette.grey[900],
    borderRadius: theme.shape.borderRadius,
    overflow: 'hidden',
  },

  [`& .${classes.video}`]: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    '& > div': {
      width: '100% !important',
      height: '100% !important',
    },
  },

  [`& .${classes.infoWrapper}`]: {
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing(1),
  },

  [`& .${classes.title}`]: {
    fontWeight: 600,
    lineHeight: 1.2,
  },

  [`& .${classes.description}`]: {
    color: theme.palette.text.secondary,
    lineHeight: 1.5,
  },
}));

export const Video: React.FC<VideoProps> = ({
  uri,
  title,
  description,
  thumbnailUri,
  onPlay,
  onPause,
  onEnded,
  onError,
  onProgress,
  width,
  height,
  controls = true,
  playing = false,
  loop = false,
  muted = false,
  volume = 0.8,
  playbackRate = 1,
}) => {
  return (
    <StyledBox className={classes.container}>
      <Box 
        className={classes.videoWrapper}
        sx={{
          ...(width && { width }),
          ...(height && { paddingTop: 0, height }),
        }}
      >
        <ReactPlayer
          className={classes.video}
          url={uri}
          light={thumbnailUri}
          controls={controls}
          playing={playing}
          loop={loop}
          muted={muted}
          volume={volume}
          playbackRate={playbackRate}
          width="100%"
          height="100%"
          onPlay={onPlay}
          onPause={onPause}
          onEnded={onEnded}
          onError={onError}
          onProgress={onProgress}
        />
      </Box>
      
      {(title || description) && (
        <Box className={classes.infoWrapper}>
          {title && (
            <Typography 
              variant="h6" 
              className={classes.title}
              gutterBottom={false}
            >
              {title}
            </Typography>
          )}
          {description && (
            <Typography 
              variant="body2" 
              className={classes.description}
            >
              {description}
            </Typography>
          )}
        </Box>
      )}
    </StyledBox>
  );
};