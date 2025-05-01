
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Loader2, History } from 'lucide-react';
import { toast } from "sonner";
import { supabase } from '@/integrations/supabase/client';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

interface BackfillFireBadgesButtonProps {
  userId?: string;
  groupId?: string;
  variant?: "default" | "outline" | "secondary" | "ghost" | "link" | "destructive";
  size?: "default" | "sm" | "lg" | "icon";
  className?: string;
}

export const BackfillFireBadgesButton: React.FC<BackfillFireBadgesButtonProps> = ({ 
  userId, 
  groupId, 
  variant = "outline", 
  size = "sm",
  className = ""
}) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDryRun, setIsDryRun] = useState(true);
  
  const handleProcess = async () => {
    setIsProcessing(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('backfill-fire-badges', {
        body: { 
          userId,
          groupId,
          dryRun: isDryRun
        }
      });
      
      if (error) {
        throw new Error(error.message);
      }
      
      const dryRunMessage = isDryRun ? "Dry run completed. " : "";
      
      toast.success(
        `${dryRunMessage}${data.message}`,
        { 
          description: isDryRun
            ? "No badges were actually created. Toggle 'Dry Run' off to create badges."
            : `Processed badges for ${data.results.length} users.`
        }
      );
      
      setIsDialogOpen(false);
    } catch (error) {
      console.error('Error backfilling fire badges:', error);
      toast.error('Failed to process historical fire badges', { 
        description: error.message || 'An unexpected error occurred' 
      });
    } finally {
      setIsProcessing(false);
    }
  };
  
  return (
    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <DialogTrigger asChild>
        <Button
          variant={variant}
          size={size}
          className={className}
        >
          <History className="h-4 w-4 mr-2" />
          Backfill Fire Badges
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Backfill Historical Fire Badges</DialogTitle>
          <DialogDescription>
            This will process historical workout data and award fire badges for weeks where users completed all assigned workouts.
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex items-center space-x-2 py-4">
          <Switch id="dry-run" checked={isDryRun} onCheckedChange={setIsDryRun} />
          <Label htmlFor="dry-run">Dry Run (simulate without creating badges)</Label>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
          <Button 
            onClick={handleProcess}
            disabled={isProcessing}
          >
            {isProcessing ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Processing...
              </>
            ) : (
              'Run Backfill'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
