
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Play, Loader2, AlertCircle } from 'lucide-react';

interface ExerciseGifViewerProps {
  exerciseId: string;
  exerciseName: string;
  gifUrl: string | null;
  className?: string;
}

export const ExerciseGifViewer = ({
  exerciseId,
  exerciseName,
  gifUrl,
  className = ''
}: ExerciseGifViewerProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(false);

  if (!gifUrl) {
    return null;
  }

  const handleImageLoad = () => {
    setIsLoading(false);
    setError(false);
  };

  const handleImageError = () => {
    setIsLoading(false);
    setError(true);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button 
          variant="outline" 
          size="sm" 
          className={`gap-1 text-blue-600 border-blue-200 hover:bg-blue-50 ${className}`}
        >
          <Play className="h-4 w-4" />
          View Form
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md max-h-[80vh] flex flex-col">
        <div className="text-lg font-semibold mb-2">{exerciseName}</div>
        <div className="flex-1 flex items-center justify-center rounded-md overflow-hidden bg-muted relative">
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-background/50">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          )}
          
          {error && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/50 p-4 text-center">
              <AlertCircle className="h-8 w-8 text-yellow-500 mb-2" />
              <p className="text-sm text-muted-foreground">
                Unable to load exercise demonstration.
              </p>
            </div>
          )}
          
          <img 
            src={gifUrl} 
            alt={`${exerciseName} demonstration`} 
            className="max-h-full object-contain"
            onLoad={handleImageLoad}
            onError={handleImageError}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
};
