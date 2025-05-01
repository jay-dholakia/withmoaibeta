
import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Flame, Loader2, InfoIcon } from 'lucide-react';
import { toast } from "sonner";
import { supabase } from '@/integrations/supabase/client';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface AwardFireBadgesButtonProps {
  groupId?: string;
  variant?: "default" | "outline" | "secondary" | "ghost" | "link" | "destructive";
  size?: "default" | "sm" | "lg" | "icon";
  className?: string;
}

export const AwardFireBadgesButton: React.FC<AwardFireBadgesButtonProps> = ({ 
  groupId, 
  variant = "outline", 
  size = "sm",
  className = ""
}) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [lastProcessedTime, setLastProcessedTime] = useState<Date | null>(null);
  
  // Fetch the last time badges were processed
  useEffect(() => {
    const fetchLastProcessedTime = async () => {
      try {
        const { data, error } = await supabase
          .from('fire_badges')
          .select('created_at')
          .order('created_at', { ascending: false })
          .limit(1);
          
        if (error) throw error;
        
        if (data && data.length > 0) {
          setLastProcessedTime(new Date(data[0].created_at));
        }
      } catch (error) {
        console.error('Error fetching last processed time:', error);
      }
    };
    
    fetchLastProcessedTime();
  }, []);
  
  const handleProcess = async () => {
    setIsProcessing(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('award-fire-badges', {
        body: { groupId }
      });
      
      if (error) {
        throw new Error(error.message);
      }
      
      toast.success(
        data.message || 'Fire badges processed successfully',
        { 
          description: 
            `Processed users: ${data.results?.length || 0}. ` +
            `New badges awarded: ${data.results?.filter(r => r.badgeAwarded).length || 0}.` 
        }
      );
      
      // Update last processed time
      setLastProcessedTime(new Date());
    } catch (error) {
      console.error('Error processing fire badges:', error);
      toast.error('Failed to process fire badges', { 
        description: error.message || 'An unexpected error occurred' 
      });
    } finally {
      setIsProcessing(false);
    }
  };
  
  const formatLastProcessed = () => {
    if (!lastProcessedTime) return 'Never';
    
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - lastProcessedTime.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 24) {
      return `${diffInHours} hour${diffInHours !== 1 ? 's' : ''} ago`;
    } else {
      const diffInDays = Math.floor(diffInHours / 24);
      return `${diffInDays} day${diffInDays !== 1 ? 's' : ''} ago`;
    }
  };
  
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant={variant}
            size={size}
            onClick={handleProcess}
            disabled={isProcessing}
            className={className}
          >
            {isProcessing ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Flame className="h-4 w-4 mr-2 text-orange-500" />
            )}
            Process Fire Badges
            {lastProcessedTime && (
              <InfoIcon className="h-3 w-3 ml-1.5 text-muted-foreground" />
            )}
          </Button>
        </TooltipTrigger>
        <TooltipContent side="right">
          <div className="text-xs">
            <p>Last processed: {formatLastProcessed()}</p>
            <p className="text-muted-foreground mt-1">Badges are also processed automatically each week</p>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};
