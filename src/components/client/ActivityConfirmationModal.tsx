
import React, { useState } from 'react';
import { 
  Dialog, DialogContent, DialogHeader, DialogTitle, 
  DialogDescription, DialogFooter 
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Copy, Check } from "lucide-react";
import { toast } from "sonner";

interface ActivityConfirmationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  activityType: string;
  activityDetails: string;
  activityEmoji: string;
}

export const ActivityConfirmationModal: React.FC<ActivityConfirmationModalProps> = ({
  open,
  onOpenChange,
  activityType,
  activityDetails,
  activityEmoji
}) => {
  const [copied, setCopied] = useState(false);
  
  const confirmationMessage = `${activityEmoji} Just completed ${activityType}! ${activityDetails}`;
  
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(confirmationMessage);
      setCopied(true);
      toast.success("Message copied to clipboard!");
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast.error("Failed to copy message");
    }
  };
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-green-700">
            <Check className="h-5 w-5" />
            <span>Activity Logged!</span>
          </DialogTitle>
          <DialogDescription>
            Your {activityType.toLowerCase()} has been saved. Share your achievement with others!
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-2 block">
              Copy this message to share:
            </label>
            <Textarea
              value={confirmationMessage}
              readOnly
              className="min-h-[80px] bg-muted"
              onClick={handleCopy}
            />
          </div>
          
          <Button 
            onClick={handleCopy}
            className="w-full gap-2"
            variant={copied ? "secondary" : "default"}
          >
            {copied ? (
              <>
                <Check className="h-4 w-4" />
                Copied!
              </>
            ) : (
              <>
                <Copy className="h-4 w-4" />
                Copy Message
              </>
            )}
          </Button>
        </div>
        
        <DialogFooter>
          <Button 
            variant="outline" 
            onClick={() => onOpenChange(false)}
          >
            Done
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
