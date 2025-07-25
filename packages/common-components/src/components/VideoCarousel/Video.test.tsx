import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { Video } from './Video';

// Mock ReactPlayer
jest.mock('react-player', () => {
  return {
    __esModule: true,
    default: jest.fn((props) => (
      <div 
        data-testid="react-player"
        data-url={props.url}
        data-controls={props.controls}
        data-playing={props.playing}
        data-light={props.light}
      >
        <video
          src={props.url}
          controls={props.controls}
          onPlay={props.onPlay}
          onPause={props.onPause}
          onEnded={props.onEnded}
          poster={typeof props.light === 'string' ? props.light : undefined}
        >
          Your browser does not support the video tag.
        </video>
      </div>
    )),
  };
});

const renderVideo = (ui: React.ReactElement) =>
  render(
    <ThemeProvider theme={createTheme()}>{ui}</ThemeProvider>
  );

describe('Video', () => {
  const defaultProps = {
    uri: 'https://example.com/video.mp4',
  };

  it('renders ReactPlayer with provided URI', () => {
    renderVideo(<Video {...defaultProps} />);
    
    const player = screen.getByTestId('react-player');
    expect(player).toBeInTheDocument();
    expect(player).toHaveAttribute('data-url', defaultProps.uri);
  });

  it('renders with title when provided', () => {
    const title = 'Test Video Title';
    renderVideo(<Video {...defaultProps} title={title} />);
    
    expect(screen.getByText(title)).toBeInTheDocument();
  });

  it('renders with description when provided', () => {
    const description = 'This is a test video description';
    renderVideo(<Video {...defaultProps} description={description} />);
    
    expect(screen.getByText(description)).toBeInTheDocument();
  });

  it('renders with both title and description', () => {
    const title = 'Test Video';
    const description = 'Test description';
    renderVideo(<Video {...defaultProps} title={title} description={description} />);
    
    expect(screen.getByText(title)).toBeInTheDocument();
    expect(screen.getByText(description)).toBeInTheDocument();
  });

  it('does not render info section when neither title nor description provided', () => {
    const { container } = renderVideo(<Video {...defaultProps} />);
    
    const infoWrapper = container.querySelector('.Video-infoWrapper');
    expect(infoWrapper).not.toBeInTheDocument();
  });

  it('sets light prop when thumbnailUri provided', () => {
    const thumbnailUri = 'https://example.com/thumbnail.jpg';
    renderVideo(<Video {...defaultProps} thumbnailUri={thumbnailUri} />);
    
    const player = screen.getByTestId('react-player');
    expect(player).toHaveAttribute('data-light', thumbnailUri);
  });

  it('calls onPlay when video starts playing', () => {
    const onPlay = jest.fn();
    renderVideo(<Video {...defaultProps} onPlay={onPlay} />);
    
    const videoElement = screen.getByTestId('react-player').querySelector('video');
    fireEvent.play(videoElement!);
    
    expect(onPlay).toHaveBeenCalledTimes(1);
  });

  it('calls onPause when video is paused', () => {
    const onPause = jest.fn();
    renderVideo(<Video {...defaultProps} onPause={onPause} />);
    
    const videoElement = screen.getByTestId('react-player').querySelector('video');
    fireEvent.pause(videoElement!);
    
    expect(onPause).toHaveBeenCalledTimes(1);
  });

  it('applies custom width when provided', () => {
    const { container } = renderVideo(<Video {...defaultProps} width={500} />);
    
    const videoWrapper = container.querySelector('.Video-videoWrapper');
    expect(videoWrapper).toHaveStyle({ width: '500px' });
  });

  it('applies custom height when provided', () => {
    const { container } = renderVideo(<Video {...defaultProps} height={300} />);
    
    const videoWrapper = container.querySelector('.Video-videoWrapper');
    expect(videoWrapper).toHaveStyle({ height: '300px', paddingTop: '0' });
  });

  it('maintains aspect ratio by default', () => {
    const { container } = renderVideo(<Video {...defaultProps} />);
    
    const videoWrapper = container.querySelector('.Video-videoWrapper');
    expect(videoWrapper).toHaveStyle({ paddingTop: '56.25%' });
  });

  it('shows controls by default', () => {
    renderVideo(<Video {...defaultProps} />);
    
    const player = screen.getByTestId('react-player');
    expect(player).toHaveAttribute('data-controls', 'true');
  });

  it('can disable controls', () => {
    renderVideo(<Video {...defaultProps} controls={false} />);
    
    const player = screen.getByTestId('react-player');
    expect(player).toHaveAttribute('data-controls', 'false');
  });

  it('calls onEnded when video ends', () => {
    const onEnded = jest.fn();
    renderVideo(<Video {...defaultProps} onEnded={onEnded} />);
    
    const videoElement = screen.getByTestId('react-player').querySelector('video');
    fireEvent.ended(videoElement!);
    
    expect(onEnded).toHaveBeenCalledTimes(1);
  });

  it('respects playing prop', () => {
    renderVideo(<Video {...defaultProps} playing={true} />);
    
    const player = screen.getByTestId('react-player');
    expect(player).toHaveAttribute('data-playing', 'true');
  });
});