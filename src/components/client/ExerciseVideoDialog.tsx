
import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { VideoPlayer } from '@/components/client/VideoPlayer';

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
