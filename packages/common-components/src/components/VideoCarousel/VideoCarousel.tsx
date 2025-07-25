import React, { useState, useRef, useEffect } from 'react';
import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import { styled, alpha } from '@mui/material/styles';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import { Video, VideoProps } from './Video';
import ReactPlayer from 'react-player';

export interface VideoItem extends Omit<VideoProps, 'width' | 'height'> {
  id: string;
}

export interface VideoCarouselProps {
  videos: VideoItem[];
  initialVideoId?: string;
  thumbnailHeight?: number;
  showThumbnailTitle?: boolean;
  onVideoChange?: (videoId: string) => void;
}

const PREFIX = 'VideoCarousel';

const classes = {
  container: `${PREFIX}-container`,
  mainVideoContainer: `${PREFIX}-mainVideoContainer`,
  thumbnailsContainer: `${PREFIX}-thumbnailsContainer`,
  thumbnailsWrapper: `${PREFIX}-thumbnailsWrapper`,
  thumbnailsScroller: `${PREFIX}-thumbnailsScroller`,
  thumbnailItem: `${PREFIX}-thumbnailItem`,
  thumbnailActive: `${PREFIX}-thumbnailActive`,
  thumbnailImage: `${PREFIX}-thumbnailImage`,
  thumbnailOverlay: `${PREFIX}-thumbnailOverlay`,
  thumbnailTitle: `${PREFIX}-thumbnailTitle`,
  navigationButton: `${PREFIX}-navigationButton`,
  playIcon: `${PREFIX}-playIcon`,
};

const StyledBox = styled(Box)(({ theme }) => ({
  [`&.${classes.container}`]: {
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing(3),
    width: '100%',
  },

  [`& .${classes.mainVideoContainer}`]: {
    width: '100%',
  },

  [`& .${classes.thumbnailsContainer}`]: {
    position: 'relative',
    width: '100%',
  },

  [`& .${classes.thumbnailsWrapper}`]: {
    position: 'relative',
    overflow: 'hidden',
    margin: `0 ${theme.spacing(5)}`,
  },

  [`& .${classes.thumbnailsScroller}`]: {
    display: 'flex',
    gap: theme.spacing(2),
    transition: 'transform 0.3s ease-in-out',
    paddingBottom: theme.spacing(1),
  },

  [`& .${classes.thumbnailItem}`]: {
    position: 'relative',
    flex: '0 0 auto',
    width: 200,
    cursor: 'pointer',
    borderRadius: theme.shape.borderRadius,
    overflow: 'hidden',
    border: `2px solid transparent`,
    transition: theme.transitions.create(['border-color', 'transform', 'box-shadow'], {
      duration: theme.transitions.duration.short,
    }),
    
    '&:hover': {
      transform: 'scale(1.05)',
      boxShadow: theme.shadows[8],
      
      [`& .${classes.thumbnailOverlay}`]: {
        opacity: 1,
      },
      
      [`& .${classes.playIcon}`]: {
        transform: 'scale(1.2)',
      },
    },
  },

  [`& .${classes.thumbnailActive}`]: {
    borderColor: theme.palette.primary.main,
    boxShadow: `0 0 0 1px ${theme.palette.primary.main}`,
  },

  [`& .${classes.thumbnailImage}`]: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    backgroundColor: theme.palette.grey[900],
  },

  [`& .${classes.thumbnailOverlay}`]: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: alpha(theme.palette.common.black, 0.4),
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    opacity: 0,
    transition: theme.transitions.create('opacity'),
  },

  [`& .${classes.thumbnailTitle}`]: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: theme.spacing(1, 1.5),
    background: `linear-gradient(to top, ${alpha(theme.palette.common.black, 0.8)} 0%, transparent 100%)`,
    color: theme.palette.common.white,
    fontSize: '0.875rem',
    fontWeight: 500,
    lineHeight: 1.2,
  },

  [`& .${classes.navigationButton}`]: {
    position: 'absolute',
    top: '50%',
    transform: 'translateY(-50%)',
    backgroundColor: alpha(theme.palette.background.paper, 0.9),
    color: theme.palette.text.primary,
    zIndex: 1,
    
    '&:hover': {
      backgroundColor: theme.palette.background.paper,
    },
    
    '&:disabled': {
      opacity: 0.3,
    },
  },

  [`& .${classes.playIcon}`]: {
    color: theme.palette.common.white,
    fontSize: 48,
    transition: theme.transitions.create('transform'),
  },
}));

export const VideoCarousel: React.FC<VideoCarouselProps> = ({
  videos,
  initialVideoId,
  thumbnailHeight = 112,
  showThumbnailTitle = true,
  onVideoChange,
}) => {
  const [activeVideoId, setActiveVideoId] = useState(
    initialVideoId || (videos.length > 0 ? videos[0].id : '')
  );
  const [scrollPosition, setScrollPosition] = useState(0);
  const scrollerRef = useRef<HTMLDivElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const activeVideo = videos.find(v => v.id === activeVideoId);

  useEffect(() => {
    if (activeVideoId && onVideoChange) {
      onVideoChange(activeVideoId);
    }
  }, [activeVideoId, onVideoChange]);

  const handleVideoSelect = (videoId: string) => {
    setActiveVideoId(videoId);
  };

  const handleScroll = (direction: 'left' | 'right') => {
    if (!scrollerRef.current || !wrapperRef.current) return;

    const wrapperWidth = wrapperRef.current.offsetWidth;
    const scrollerWidth = scrollerRef.current.scrollWidth;
    const maxScroll = scrollerWidth - wrapperWidth;
    const scrollAmount = wrapperWidth * 0.8;

    let newPosition = scrollPosition;
    if (direction === 'left') {
      newPosition = Math.max(0, scrollPosition - scrollAmount);
    } else {
      newPosition = Math.min(maxScroll, scrollPosition + scrollAmount);
    }

    setScrollPosition(newPosition);
  };

  const canScrollLeft = scrollPosition > 0;
  const canScrollRight = scrollerRef.current && wrapperRef.current
    ? scrollPosition < scrollerRef.current.scrollWidth - wrapperRef.current.offsetWidth
    : false;

  if (videos.length === 0) {
    return null;
  }

  return (
    <StyledBox className={classes.container}>
      {activeVideo && (
        <Box className={classes.mainVideoContainer}>
          <Video
            uri={activeVideo.uri}
            title={activeVideo.title}
            description={activeVideo.description}
            thumbnailUri={activeVideo.thumbnailUri}
            onPlay={activeVideo.onPlay}
            onPause={activeVideo.onPause}
          />
        </Box>
      )}

      {videos.length > 1 && (
        <Box className={classes.thumbnailsContainer}>
          <IconButton
            className={classes.navigationButton}
            sx={{ left: 0 }}
            onClick={() => handleScroll('left')}
            disabled={!canScrollLeft}
            size="small"
            aria-label="Previous"
          >
            <ChevronLeftIcon />
          </IconButton>

          <Box className={classes.thumbnailsWrapper} ref={wrapperRef}>
            <Box
              className={classes.thumbnailsScroller}
              ref={scrollerRef}
              sx={{
                transform: `translateX(-${scrollPosition}px)`,
              }}
            >
              {videos.map((video) => (
                <Box
                  key={video.id}
                  className={`${classes.thumbnailItem} ${
                    video.id === activeVideoId ? classes.thumbnailActive : ''
                  }`}
                  onClick={() => handleVideoSelect(video.id)}
                  sx={{ height: thumbnailHeight }}
                >
                  {video.thumbnailUri || ReactPlayer.canPlay(video.uri) ? (
                    <img
                      src={video.thumbnailUri || `https://img.youtube.com/vi/${video.uri.split('/').pop()}/0.jpg`}
                      alt={video.title || 'Video thumbnail'}
                      className={classes.thumbnailImage}
                      onError={(e) => {
                        // Fallback if thumbnail fails to load
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                        const parent = target.parentElement;
                        if (parent) {
                          const fallback = document.createElement('div');
                          fallback.className = classes.thumbnailImage;
                          fallback.style.display = 'flex';
                          fallback.style.alignItems = 'center';
                          fallback.style.justifyContent = 'center';
                          fallback.innerHTML = '<svg class="MuiSvgIcon-root" style="font-size: 40px; opacity: 0.5;" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"></path></svg>';
                          parent.appendChild(fallback);
                        }
                      }}
                    />
                  ) : (
                    <Box
                      className={classes.thumbnailImage}
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <PlayArrowIcon sx={{ fontSize: 40, opacity: 0.5 }} />
                    </Box>
                  )}
                  
                  <Box className={classes.thumbnailOverlay}>
                    <PlayArrowIcon className={classes.playIcon} />
                  </Box>
                  
                  {showThumbnailTitle && video.title && (
                    <Box className={classes.thumbnailTitle}>
                      {video.title}
                    </Box>
                  )}
                </Box>
              ))}
            </Box>
          </Box>

          <IconButton
            className={classes.navigationButton}
            sx={{ right: 0 }}
            onClick={() => handleScroll('right')}
            disabled={!canScrollRight}
            size="small"
            aria-label="Next"
          >
            <ChevronRightIcon />
          </IconButton>
        </Box>
      )}
    </StyledBox>
  );
};