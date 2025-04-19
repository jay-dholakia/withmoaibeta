import React from 'react';
import ReactPlayer from 'react-player';
import { AspectRatio } from "@/components/ui/aspect-ratio"

interface VideoPlayerProps {
  url: string;  // Changed from videoUrl to url
}

export const VideoPlayer: React.FC<VideoPlayerProps> = ({ url }) => {
  return (
    <AspectRatio ratio={16 / 9}>
      <ReactPlayer
        url={url}
        width="100%"
        height="100%"
        controls={true}
      />
    </AspectRatio>
  );
};
