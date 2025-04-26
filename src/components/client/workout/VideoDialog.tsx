
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import VideoPlayer from "@/components/client/VideoPlayer"

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
      <DialogContent className="sm:max-w-[800px]">
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
