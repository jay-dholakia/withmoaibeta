
import React, { useState, useEffect } from 'react';
import ReactPlayer from 'react-player/lazy';
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { Loader2 } from "lucide-react";

interface VideoPlayerProps {
  url: string;
}

export const VideoPlayer: React.FC<VideoPlayerProps> = ({ url }) => {
  const [loading, setLoading] = useState(true);

  // Reset loading state when URL changes
  useEffect(() => {
    setLoading(true);
  }, [url]);

  return (
    <AspectRatio ratio={16 / 9} className="relative">
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      )}
      <ReactPlayer
        url={url}
        width="100%"
        height="100%"
        controls={true}
        onReady={() => setLoading(false)}
        fallback={
          <div className="h-full w-full flex items-center justify-center bg-gray-100">
            <p className="text-gray-500">Video player loading...</p>
          </div>
        }
      />
    </AspectRatio>
  );
};

export default VideoPlayer;
