
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import VideoPlayer from "@/components/client/VideoPlayer"
import { cn } from "@/lib/utils"

interface VideoDialogProps {
  isOpen: boolean
  onClose: () => void
  videoUrl: string
  exerciseName: string
}

export const VideoDialog: React.FC<VideoDialogProps> = ({
  isOpen,
  onClose,
  videoUrl,
  exerciseName,
}) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className={cn(
        "sm:max-w-[800px]",
        "rounded-2xl p-6", // Match swap dialog rounded corners and padding
        "max-h-[500px] overflow-y-auto"
      )}>
        <DialogHeader>
          <DialogTitle>{exerciseName} Demo</DialogTitle>
        </DialogHeader>
        <div className="mt-4">
          <VideoPlayer url={videoUrl} />
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default VideoDialog
