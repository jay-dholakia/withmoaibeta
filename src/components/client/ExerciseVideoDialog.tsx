
import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from '@/components/ui/dialog';
import { VideoPlayer } from '@/components/client/VideoPlayer';
import { X } from 'lucide-react';

interface ExerciseVideoDialogProps {
  isOpen: boolean;
  onClose: () => void;
  exerciseName: string;
  youtubeUrl?: string;
}

const ExerciseVideoDialog: React.FC<ExerciseVideoDialogProps> = ({
  isOpen,
  onClose,
  exerciseName,
  youtubeUrl
}) => {
  if (!youtubeUrl) return null;
  
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle className="text-xl">{exerciseName}</DialogTitle>
          <DialogClose 
            onClick={onClose} 
            className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground"
          >
            <X className="h-4 w-4" />
            <span className="sr-only">Close</span>
          </DialogClose>
        </DialogHeader>
        <VideoPlayer 
          youtubeUrl={youtubeUrl}
          className="w-full aspect-video rounded-md"
        />
      </DialogContent>
    </Dialog>
  );
};

export default ExerciseVideoDialog;
