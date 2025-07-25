import React from 'react';
import { CustomInfoCard, CustomInfoCardProps } from '../CustomInfoCard/CustomInfoCard';
import { VideoCarousel, VideoCarouselProps } from './VideoCarousel';
import { CustomInfoCardButtonGroup } from '../CustomInfoCard/CustomInfoCardFooterButtons/CustomInfoCardButtonGroup';

export interface VideoCarouselCardProps extends Omit<CustomInfoCardProps, 'children' | 'footerButtonsComponent'> {
  videos: VideoCarouselProps['videos'];
  initialVideoId?: VideoCarouselProps['initialVideoId'];
  thumbnailHeight?: VideoCarouselProps['thumbnailHeight'];
  showThumbnailTitle?: VideoCarouselProps['showThumbnailTitle'];
  onVideoChange?: VideoCarouselProps['onVideoChange'];
  footerButtons?: Array<{
    label: string;
    onClick: () => void;
    variant?: 'text' | 'outlined' | 'contained';
    color?: 'inherit' | 'primary' | 'secondary' | 'success' | 'error' | 'info' | 'warning';
    disabled?: boolean;
  }>;
  footerButtonsComponent?: CustomInfoCardProps['footerButtonsComponent'];
}

export const VideoCarouselCard: React.FC<VideoCarouselCardProps> = ({
  videos,
  initialVideoId,
  thumbnailHeight,
  showThumbnailTitle,
  onVideoChange,
  title = 'Videos',
  footerButtons,
  footerButtonsComponent,
  ...customInfoCardProps
}) => {
  // Convert footerButtons array to CustomInfoCardButtonGroup if provided
  const footerComponent = footerButtonsComponent || (footerButtons ? (
    <CustomInfoCardButtonGroup buttons={footerButtons} />
  ) : undefined);

  return (
    <CustomInfoCard 
      title={title} 
      footerButtonsComponent={footerComponent}
      {...customInfoCardProps}
    >
      <VideoCarousel
        videos={videos}
        initialVideoId={initialVideoId}
        thumbnailHeight={thumbnailHeight}
        showThumbnailTitle={showThumbnailTitle}
        onVideoChange={onVideoChange}
      />
    </CustomInfoCard>
  );
};