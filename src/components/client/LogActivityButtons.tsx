
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { LogRunActivityDialog } from './LogRunActivityDialog';
import { LogCardioActivityDialog } from './LogCardioActivityDialog';
import { LogRestDayDialog } from './LogRestDayDialog';
import { Activity, Armchair, Plus } from 'lucide-react';

interface LogActivityButtonsProps {
  onActivityLogged?: () => void;
}

export const LogActivityButtons: React.FC<LogActivityButtonsProps> = ({ onActivityLogged }) => {
  const [showRunDialog, setShowRunDialog] = useState(false);
  const [showCardioDialog, setShowCardioDialog] = useState(false);
  const [showRestDialog, setShowRestDialog] = useState(false);
  
  const handleActivitySuccess = () => {
    if (onActivityLogged) {
      onActivityLogged();
    }
  };
  
  return (
    <>
      <div className="grid grid-cols-1 gap-3 mb-4">
        <Button 
          onClick={() => setShowRunDialog(true)}
          variant="outline" 
          className="flex items-center justify-center gap-2 text-blue-600 border-blue-200 hover:bg-blue-50"
        >
          <Plus className="h-4 w-4" />
          <span>Log Run 🏃</span>
        </Button>
        
        <Button 
          onClick={() => setShowCardioDialog(true)}
          variant="outline"
          className="flex items-center justify-center gap-2 text-purple-600 border-purple-200 hover:bg-purple-50"
        >
          <Plus className="h-4 w-4" />
          <span>Log Cardio Cross Training 🚴</span>
        </Button>
        
        <Button 
          onClick={() => setShowRestDialog(true)} 
          variant="outline"
          className="flex items-center justify-center gap-2 text-amber-600 border-amber-200 hover:bg-amber-50"
        >
          <Plus className="h-4 w-4" />
          <span>Log Rest Day 😴</span>
        </Button>
      </div>
      
      <LogRunActivityDialog 
        open={showRunDialog} 
        onOpenChange={setShowRunDialog}
        onSuccess={handleActivitySuccess} 
      />
      
      <LogCardioActivityDialog 
        open={showCardioDialog} 
        onOpenChange={setShowCardioDialog}
        onSuccess={handleActivitySuccess} 
      />
      
      <LogRestDayDialog 
        open={showRestDialog} 
        onOpenChange={setShowRestDialog}
        onSuccess={handleActivitySuccess} 
      />
    </>
  );
};
