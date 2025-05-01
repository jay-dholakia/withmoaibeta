
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Flame, Loader2 } from 'lucide-react';
import { toast } from "sonner";
import { supabase } from '@/integrations/supabase/client';

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
    } catch (error) {
      console.error('Error processing fire badges:', error);
      toast.error('Failed to process fire badges', { 
        description: error.message || 'An unexpected error occurred' 
      });
    } finally {
      setIsProcessing(false);
    }
  };
  
  return (
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
    </Button>
  );
};
