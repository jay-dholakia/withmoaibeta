
import React, { useState } from 'react';
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Profile } from '@/types/user'; // Explicitly import Profile type

export function VacationModeToggle() {
  const { user, profile } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [isEnabled, setIsEnabled] = useState(!!Profile?.vacation_mode);

  const handleToggle = async (enabled: boolean) => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('client_profiles')
        .update({ vacation_mode: enabled })
        .eq('id', user.id);

      if (error) throw error;

      setIsEnabled(enabled);
      toast.success(enabled ? 'Vacation mode enabled' : 'Vacation mode disabled');
    } catch (error) {
      console.error('Error toggling vacation mode:', error);
      toast.error('Failed to update vacation mode');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center space-x-2">
      <Switch
        checked={isEnabled}
        onCheckedChange={handleToggle}
        disabled={isLoading}
      />
      <Label className="flex items-center gap-2">
        Vacation Mode
        {isEnabled && <span>🌴</span>}
      </Label>
    </div>
  );
}

export default VacationModeToggle;
