import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface VideoPlayerProps {
  bucketName?: string;
  filePath?: string;
  youtubeUrl?: string;
  className?: string;
  autoPlay?: boolean;
  controls?: boolean;
  muted?: boolean;
  loop?: boolean;
}

export const VideoPlayer = ({
  bucketName,
  filePath,
  youtubeUrl,
  className = '',
  autoPlay = false,
  controls = true,
  muted = false,
  loop = false
}: VideoPlayerProps) => {
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [youtubeEmbedUrl, setYoutubeEmbedUrl] = useState<string | null>(null);

  useEffect(() => {
    const fetchVideoUrl = async () => {
      try {
        setLoading(true);
        
        // If YouTube URL is provided, process it to get embed URL
        if (youtubeUrl) {
          const embedUrl = processYouTubeUrl(youtubeUrl);
          setYoutubeEmbedUrl(embedUrl);
          setLoading(false);
          return;
        }
        
        // Otherwise use Supabase storage
        if (bucketName && filePath) {
          // Get public URL if the bucket is public
          const { data } = await supabase.storage
            .from(bucketName)
            .getPublicUrl(filePath);
          
          if (data.publicUrl) {
            setVideoUrl(data.publicUrl);
          } else {
            throw new Error('Could not get public URL for video');
          }
        } else {
          setError('No video source provided');
        }
      } catch (err) {
        console.error('Error fetching video:', err);
        setError('Could not load video. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchVideoUrl();
  }, [bucketName, filePath, youtubeUrl]);

  // Function to convert YouTube URLs to embed format
  const processYouTubeUrl = (url: string): string => {
    // Regular expressions to match YouTube URL patterns
    const regexps = [
      /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com|youtu\.be)\/(?:watch\?v=)?([a-zA-Z0-9_-]{11})/,
      /(?:https?:\/\/)?(?:www\.)?youtu\.be\/([a-zA-Z0-9_-]{11})/,
      /(?:https?:\/\/)?(?:www\.)?youtube\.com\/embed\/([a-zA-Z0-9_-]{11})/
    ];

    let videoId = null;

    // Try to extract video ID using the regexps
    for (const regex of regexps) {
      const match = url.match(regex);
      if (match && match[1]) {
        videoId = match[1];
        break;
      }
    }

    if (videoId) {
      return `https://www.youtube.com/embed/${videoId}?rel=0`;
    }

    // If we can't extract ID, return original URL (may not work as embed)
    console.warn('Could not extract YouTube video ID from URL:', url);
    return url;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center bg-slate-100 rounded-lg w-full h-48">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-client"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center bg-slate-100 rounded-lg w-full h-48 text-slate-500 text-sm px-4 text-center">
        {error}
      </div>
    );
  }

  if (youtubeEmbedUrl) {
    return (
      <iframe
        src={youtubeEmbedUrl}
        className={`w-full rounded-lg aspect-video ${className}`}
        allowFullScreen
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        title="YouTube video player"
      />
    );
  }

  return (
    <video
      src={videoUrl || undefined}
      className={`w-full rounded-lg ${className}`}
      controls={controls}
      autoPlay={autoPlay}
      muted={muted}
      loop={loop}
    >
      Your browser does not support the video tag.
    </video>
  );
};
