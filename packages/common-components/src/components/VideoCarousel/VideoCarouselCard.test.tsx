import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { MemoryRouter } from 'react-router-dom';
import { VideoCarouselCard } from './VideoCarouselCard';
import { VideoItem } from './VideoCarousel';

// Mock ReactPlayer
jest.mock('react-player', () => ({
  __esModule: true,
  default: jest.fn((props) => (
    <div 
      data-testid="react-player"
      data-url={props.url}
    >
      <video src={props.url}>Video</video>
    </div>
  )),
}));

// Mock the static method separately
const ReactPlayer = require('react-player').default;
ReactPlayer.canPlay = jest.fn(() => true);

const renderCard = (ui: React.ReactElement) =>
  render(
    <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <ThemeProvider theme={createTheme()}>{ui}</ThemeProvider>
    </MemoryRouter>
  );

describe('VideoCarouselCard', () => {
  const mockVideos: VideoItem[] = [
    {
      id: '1',
      uri: 'https://example.com/video1.mp4',
      title: 'Video 1',
      description: 'Description 1',
    },
    {
      id: '2',
      uri: 'https://example.com/video2.mp4',
      title: 'Video 2',
      description: 'Description 2',
    },
  ];

  it('renders with default title', () => {
    renderCard(<VideoCarouselCard videos={mockVideos} />);
    
    expect(screen.getByText('Videos')).toBeInTheDocument();
  });

  it('renders with custom title', () => {
    renderCard(<VideoCarouselCard videos={mockVideos} title="My Video Collection" />);
    
    expect(screen.getByText('My Video Collection')).toBeInTheDocument();
  });

  it('renders video carousel inside card', () => {
    renderCard(<VideoCarouselCard videos={mockVideos} />);
    
    // Check that video content is rendered - using getAllByText since title appears in main video and thumbnail
    const videoTitles = screen.getAllByText('Video 1');
    expect(videoTitles.length).toBeGreaterThan(0);
    expect(screen.getByText('Description 1')).toBeInTheDocument();
  });

  it('passes video props to carousel', () => {
    const onVideoChange = jest.fn();
    renderCard(
      <VideoCarouselCard 
        videos={mockVideos} 
        initialVideoId="2"
        onVideoChange={onVideoChange}
        thumbnailHeight={100}
        showThumbnailTitle={false}
      />
    );
    
    // Should show second video initially
    expect(screen.getByText('Video 2')).toBeInTheDocument();
    expect(screen.getByText('Description 2')).toBeInTheDocument();
    
    // onVideoChange should have been called
    expect(onVideoChange).toHaveBeenCalledWith('2');
  });

  it('renders with custom info card props', () => {
    const onMenuClick = jest.fn();
    renderCard(
      <VideoCarouselCard 
        videos={mockVideos}
        menuActions={[{ label: 'Test Action', onClick: onMenuClick }]}
        isCollapsible
      />
    );
    
    // Check settings button is rendered
    expect(screen.getByLabelText('settings')).toBeInTheDocument();
    
    // Check collapse button is rendered
    expect(screen.getByLabelText('collapse')).toBeInTheDocument();
    
    // Test menu action click
    fireEvent.click(screen.getByLabelText('settings'));
    fireEvent.click(screen.getByText('Test Action'));
    expect(onMenuClick).toHaveBeenCalledTimes(1);
  });

  it('renders with footer buttons', () => {
    const handleClick = jest.fn();
    renderCard(
      <VideoCarouselCard 
        videos={mockVideos}
        footerButtons={[
          { label: 'View All', onClick: handleClick }
        ]}
      />
    );
    
    // Footer buttons are rendered in CardActions
    const button = screen.getByRole('button', { name: 'View All' });
    expect(button).toBeInTheDocument();
    
    fireEvent.click(button);
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('handles collapsible state', async () => {
    renderCard(
      <VideoCarouselCard 
        videos={mockVideos}
        isCollapsible
      />
    );
    
    // Content should be initially visible
    expect(screen.getByText('Description 1')).toBeInTheDocument();
    
    // Click to collapse
    const collapseButton = screen.getByLabelText('collapse');
    fireEvent.click(collapseButton);
    
    // Wait for collapse animation to complete
    await waitFor(() => {
      // Content should now be hidden
      expect(screen.queryByText('Description 1')).not.toBeInTheDocument();
    });
    
    // Click to expand again
    const expandButton = screen.getByLabelText('expand');
    fireEvent.click(expandButton);
    
    // Wait for expand animation to complete
    await waitFor(() => {
      // Content should be visible again
      expect(screen.getByText('Description 1')).toBeInTheDocument();
    });
  });

  it('passes through CustomInfoCard features', () => {
    const onMenuClick = jest.fn();
    
    renderCard(
      <VideoCarouselCard 
        videos={mockVideos}
        menuActions={[{ label: 'Test Action', onClick: onMenuClick }]}
        isCollapsible
        titleTypographyProps={{ variant: 'h4' }}
      />
    );
    
    // Test settings menu click
    fireEvent.click(screen.getByLabelText('settings'));
    fireEvent.click(screen.getByText('Test Action'));
    expect(onMenuClick).toHaveBeenCalledTimes(1);
    
    // Test collapse button exists
    const collapseButton = screen.getByLabelText('collapse');
    expect(collapseButton).toBeInTheDocument();
  });

  it('handles empty videos array', () => {
    renderCard(<VideoCarouselCard videos={[]} title="No Videos" />);
    
    // Card should still render with title
    expect(screen.getByText('No Videos')).toBeInTheDocument();
    
    // But no video content
    expect(screen.queryByTestId('react-player')).not.toBeInTheDocument();
  });

  it('integrates with video carousel callbacks', () => {
    const onVideoChange = jest.fn();
    renderCard(
      <VideoCarouselCard 
        videos={mockVideos}
        onVideoChange={onVideoChange}
      />
    );
    
    // Click on a thumbnail to change video
    const thumbnails = screen.getAllByRole('img');
    if (thumbnails.length > 1) {
      fireEvent.click(thumbnails[1].closest('.VideoCarousel-thumbnailItem')!);
      expect(onVideoChange).toHaveBeenCalledWith('2');
    }
  });
});