
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Music } from 'lucide-react';
import SpotifyPlayerDialog from './SpotifyPlayerDialog';

interface SpotifyPlaylistButtonProps {
  playlistUrl: string;
  playlistTitle?: string;
}

const SpotifyPlaylistButton: React.FC<SpotifyPlaylistButtonProps> = ({ 
  playlistUrl,
  playlistTitle = "Team Playlist" 
}) => {
  const [dialogOpen, setDialogOpen] = useState(false);

  return (
    <>
      <Button
        onClick={() => setDialogOpen(true)}
        variant="outline"
        size="sm"
        className="gap-1.5 bg-white/80 border-client/20 text-client hover:bg-white hover:text-client/80"
      >
        <Music className="h-4 w-4" />
        Team Playlist
      </Button>

      <SpotifyPlayerDialog
        isOpen={dialogOpen}
        onClose={() => setDialogOpen(false)}
        playlistUrl={playlistUrl}
        playlistTitle={playlistTitle}
      />
    </>
  );
};

export default SpotifyPlaylistButton;
