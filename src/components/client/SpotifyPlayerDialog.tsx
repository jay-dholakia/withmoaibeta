
import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

interface SpotifyPlayerDialogProps {
  isOpen: boolean;
  onClose: () => void;
  playlistUrl: string;
  playlistTitle: string;
}

const SpotifyPlayerDialog: React.FC<SpotifyPlayerDialogProps> = ({
  isOpen,
  onClose,
  playlistUrl,
  playlistTitle,
}) => {
  // Extract Spotify playlist ID from URL
  const getSpotifyEmbedUrl = (url: string) => {
    // Handle different Spotify URL formats
    const spotifyRegex = /spotify.com\/playlist\/([a-zA-Z0-9]+)/;
    const match = url.match(spotifyRegex);
    
    if (match && match[1]) {
      return `https://open.spotify.com/embed/playlist/${match[1]}?utm_source=generator`;
    }
    
    // If no match found, return the original URL (will be handled by error state)
    return url;
  };

  const embedUrl = getSpotifyEmbedUrl(playlistUrl);
  const isValidSpotifyUrl = embedUrl.includes('spotify.com/embed/playlist/');

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] h-[70vh] max-h-[700px] p-0 gap-0">
        <DialogHeader className="p-4 pb-2">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-lg">{playlistTitle}</DialogTitle>
            <DialogClose asChild>
              <Button variant="ghost" size="icon" className="rounded-full h-8 w-8">
                <X className="h-4 w-4" />
              </Button>
            </DialogClose>
          </div>
          <DialogDescription className="text-xs">
            Moai Team Playlist
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex-1 overflow-hidden p-0 h-full">
          {isValidSpotifyUrl ? (
            <iframe 
              src={embedUrl}
              width="100%" 
              height="100%" 
              frameBorder="0" 
              allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" 
              loading="lazy"
              title="Spotify Playlist"
              className="block"
            />
          ) : (
            <div className="flex items-center justify-center h-full p-4 text-center">
              <p className="text-muted-foreground">
                Invalid Spotify playlist URL. Please make sure you're using a valid Spotify playlist link.
              </p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SpotifyPlayerDialog;
