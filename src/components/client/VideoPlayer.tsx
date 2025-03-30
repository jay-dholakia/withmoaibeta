
import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface VideoPlayerProps {
  bucketName: string;
  filePath: string;
  className?: string;
  autoPlay?: boolean;
  controls?: boolean;
  muted?: boolean;
  loop?: boolean;
}

export const VideoPlayer = ({
  bucketName,
  filePath,
  className = '',
  autoPlay = false,
  controls = true,
  muted = false,
  loop = false
}: VideoPlayerProps) => {
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchVideoUrl = async () => {
      try {
        setLoading(true);
        
        // Get public URL if the bucket is public
        const { data, error } = await supabase.storage
          .from(bucketName)
          .getPublicUrl(filePath);
        
        if (error) throw error;
        
        if (data.publicUrl) {
          setVideoUrl(data.publicUrl);
        } else {
          throw new Error('Could not get public URL for video');
        }
      } catch (err) {
        console.error('Error fetching video:', err);
        setError('Could not load video. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchVideoUrl();
  }, [bucketName, filePath]);

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
