
import React from 'react';
import { Switch } from '@/components/ui/switch';
import { useAuth } from '@/contexts/AuthContext';
import { updateClientProfile } from '@/services/client-service';
import { toast } from 'sonner';

const VacationModeToggle = () => {
  const { user, profile, refreshUser } = useAuth();
  
  const isInVacationMode = profile && profile.vacation_mode === true;
  
  const toggleVacationMode = async () => {
    try {
      if (!user?.id) return;
      
      await updateClientProfile(user.id, {
        vacation_mode: !isInVacationMode
      });
      
      toast.success(`Vacation mode ${!isInVacationMode ? 'enabled' : 'disabled'}`);
      refreshUser();
    } catch (error) {
      console.error('Error toggling vacation mode:', error);
      toast.error('Failed to update vacation mode');
    }
  };
  
  return (
    <Switch 
      checked={isInVacationMode}
      onCheckedChange={toggleVacationMode}
    />
  );
};

export default VacationModeToggle;
