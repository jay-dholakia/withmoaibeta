
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Flame, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';

interface AwardFireBadgesButtonProps {
  className?: string;
}

export const AwardFireBadgesButton: React.FC<AwardFireBadgesButtonProps> = ({ 
  className 
}) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const { profile } = useAuth();
  
  const isAdmin = profile?.user_type === 'admin';
  
  const handleAwardBadges = async () => {
    if (!isAdmin) {
      toast.error('Only administrators can perform this action.');
      return;
    }
    
    try {
      setIsProcessing(true);
      
      const { data, error } = await supabase.functions.invoke('award-fire-badges');
      
      if (error) {
        console.error('Error invoking award-fire-badges function:', error);
        toast.error('Failed to process fire badges.');
        return;
      }
      
      console.log('Award fire badges result:', data);
      toast.success('Fire badges processed successfully!');
      
    } catch (error) {
      console.error('Error in award fire badges process:', error);
      toast.error('An error occurred while processing fire badges.');
    } finally {
      setIsProcessing(false);
    }
  };
  
  if (!isAdmin) {
    return null;
  }
  
  return (
    <Button 
      variant="outline" 
      size="sm" 
      className={className}
      onClick={handleAwardBadges}
      disabled={isProcessing}
    >
      {isProcessing ? (
        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
      ) : (
        <Flame className="h-4 w-4 mr-2 text-amber-500" />
      )}
      <span>Process Fire Badges</span>
    </Button>
  );
};
