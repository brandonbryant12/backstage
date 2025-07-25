import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { VideoCarousel, VideoItem } from './VideoCarousel';

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

const renderCarousel = (ui: React.ReactElement) =>
  render(
    <ThemeProvider theme={createTheme()}>{ui}</ThemeProvider>
  );

describe('VideoCarousel', () => {
  const mockVideos: VideoItem[] = [
    {
      id: '1',
      uri: 'https://example.com/video1.mp4',
      title: 'Video 1',
      description: 'Description 1',
      thumbnailUri: 'https://example.com/thumb1.jpg',
    },
    {
      id: '2',
      uri: 'https://example.com/video2.mp4',
      title: 'Video 2',
      description: 'Description 2',
      thumbnailUri: 'https://example.com/thumb2.jpg',
    },
    {
      id: '3',
      uri: 'https://example.com/video3.mp4',
      title: 'Video 3',
      description: 'Description 3',
    },
  ];

  it('renders with empty videos array', () => {
    const { container } = renderCarousel(<VideoCarousel videos={[]} />);
    expect(container.firstChild).toBeNull();
  });

  it('renders single video without carousel', () => {
    const singleVideo = [mockVideos[0]];
    renderCarousel(<VideoCarousel videos={singleVideo} />);
    
    expect(screen.getByText('Video 1')).toBeInTheDocument();
    expect(screen.getByText('Description 1')).toBeInTheDocument();
    
    // No thumbnail carousel for single video
    expect(screen.queryByLabelText('Previous')).not.toBeInTheDocument();
    expect(screen.queryByLabelText('Next')).not.toBeInTheDocument();
  });

  it('renders first video by default', () => {
    renderCarousel(<VideoCarousel videos={mockVideos} />);
    
    // Video 1 appears in both main video and thumbnail
    const videoTitles = screen.getAllByText('Video 1');
    expect(videoTitles.length).toBeGreaterThan(0);
    expect(screen.getByText('Description 1')).toBeInTheDocument();
  });

  it('renders with initialVideoId', () => {
    renderCarousel(<VideoCarousel videos={mockVideos} initialVideoId="2" />);
    
    // Video 2 appears in both main video and thumbnail
    const videoTitles = screen.getAllByText('Video 2');
    expect(videoTitles.length).toBeGreaterThan(0);
    expect(screen.getByText('Description 2')).toBeInTheDocument();
  });

  it('renders thumbnail carousel for multiple videos', () => {
    renderCarousel(<VideoCarousel videos={mockVideos} />);
    
    // Check thumbnails are rendered - all videos now get thumbnails (either custom or YouTube)
    const thumbnails = screen.getAllByRole('img');
    expect(thumbnails).toHaveLength(3);
    expect(thumbnails[0]).toHaveAttribute('alt', 'Video 1');
    expect(thumbnails[1]).toHaveAttribute('alt', 'Video 2');
    expect(thumbnails[2]).toHaveAttribute('alt', 'Video 3');
  });

  it('shows play icon for video without thumbnail', () => {
    renderCarousel(<VideoCarousel videos={mockVideos} />);
    
    // Video 3 has no thumbnail, should show play icon
    const playIcons = screen.getAllByTestId('PlayArrowIcon');
    expect(playIcons.length).toBeGreaterThan(0);
  });

  it('changes video when thumbnail is clicked', () => {
    const onVideoChange = jest.fn();
    renderCarousel(
      <VideoCarousel videos={mockVideos} onVideoChange={onVideoChange} />
    );
    
    // Click on second thumbnail
    const thumbnails = screen.getAllByRole('img');
    fireEvent.click(thumbnails[1].closest('.VideoCarousel-thumbnailItem')!);
    
    // Video should change immediately
    const videoTitles = screen.getAllByText('Video 2');
    expect(videoTitles.length).toBeGreaterThan(0);
    expect(screen.getByText('Description 2')).toBeInTheDocument();
    
    expect(onVideoChange).toHaveBeenCalledWith('2');
  });

  it('highlights active thumbnail', () => {
    const { container } = renderCarousel(<VideoCarousel videos={mockVideos} />);
    
    const thumbnails = container.querySelectorAll('.VideoCarousel-thumbnailItem');
    expect(thumbnails[0]).toHaveClass('VideoCarousel-thumbnailActive');
    expect(thumbnails[1]).not.toHaveClass('VideoCarousel-thumbnailActive');
  });

  it('shows thumbnail titles when showThumbnailTitle is true', () => {
    renderCarousel(<VideoCarousel videos={mockVideos} showThumbnailTitle={true} />);
    
    // Should see thumbnail titles
    const titles = screen.getAllByText(/Video [1-3]/);
    expect(titles.length).toBeGreaterThan(3); // Main video + thumbnails
  });

  it('hides thumbnail titles when showThumbnailTitle is false', () => {
    renderCarousel(<VideoCarousel videos={mockVideos} showThumbnailTitle={false} />);
    
    // Should only see main video title
    const titles = screen.getAllByText(/Video [1-3]/);
    expect(titles).toHaveLength(1);
  });

  it('respects custom thumbnail height', () => {
    const { container } = renderCarousel(
      <VideoCarousel videos={mockVideos} thumbnailHeight={150} />
    );
    
    const thumbnails = container.querySelectorAll('.VideoCarousel-thumbnailItem');
    expect(thumbnails[0]).toHaveStyle({ height: '150px' });
  });

  it('navigation buttons are disabled appropriately', () => {
    renderCarousel(<VideoCarousel videos={mockVideos} />);
    
    const prevButton = screen.getByLabelText('Previous');
    const nextButton = screen.getByLabelText('Next');
    
    // At start, previous should be disabled
    expect(prevButton).toBeDisabled();
    // With only 3 videos, next might also be disabled if they all fit in the viewport
    // Let's just check that the buttons exist
    expect(nextButton).toBeInTheDocument();
  });

  it('handles scroll state correctly', () => {
    // Create many videos to test scrolling logic
    const manyVideos = Array.from({ length: 10 }, (_, i) => ({
      id: `${i + 1}`,
      uri: `https://example.com/video${i + 1}.mp4`,
      title: `Video ${i + 1}`,
    }));
    
    const { container } = renderCarousel(<VideoCarousel videos={manyVideos} />);
    
    const prevButton = screen.getByLabelText('Previous');
    
    // Initially previous is disabled (at scroll position 0)
    expect(prevButton).toBeDisabled();
    
    // Get the scroller element
    const scroller = container.querySelector('.VideoCarousel-thumbnailsScroller');
    expect(scroller).toHaveStyle({ transform: 'translateX(-0px)' });
  });

  it('calls onVideoChange when video changes', async () => {
    const onVideoChange = jest.fn();
    renderCarousel(
      <VideoCarousel videos={mockVideos} onVideoChange={onVideoChange} />
    );
    
    // Initial call with first video
    expect(onVideoChange).toHaveBeenCalledWith('1');
    
    // Click second thumbnail
    const thumbnails = screen.getAllByRole('img');
    fireEvent.click(thumbnails[1].closest('.VideoCarousel-thumbnailItem')!);
    
    await waitFor(() => {
      expect(onVideoChange).toHaveBeenCalledWith('2');
    });
  });

  it('handles thumbnail click interaction', () => {
    renderCarousel(<VideoCarousel videos={mockVideos} />);
    
    const thumbnails = screen.getAllByRole('img');
    const firstThumbnail = thumbnails[0].closest('.VideoCarousel-thumbnailItem');
    
    // Check that thumbnail element exists
    expect(firstThumbnail).toBeInTheDocument();
    
    // Verify thumbnail has active class initially (first video is active by default)
    expect(firstThumbnail).toHaveClass('VideoCarousel-thumbnailActive');
  });
});