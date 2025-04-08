
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { LogRunActivityDialog } from './LogRunActivityDialog';
import { LogCardioActivityDialog } from './LogCardioActivityDialog';
import { LogRestDayDialog } from './LogRestDayDialog';
import { Activity, Armchair } from 'lucide-react';

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
      <div className="grid grid-cols-2 gap-3 mb-4">
        <Button 
          onClick={() => setShowRunDialog(true)}
          variant="outline" 
          className="flex items-center justify-center gap-2 text-blue-600 border-blue-200 hover:bg-blue-50"
        >
          <span role="img" aria-label="running" className="text-lg">🏃</span>
          Log Run
        </Button>
        
        <Button 
          onClick={() => setShowCardioDialog(true)}
          variant="outline"
          className="flex items-center justify-center gap-2 text-purple-600 border-purple-200 hover:bg-purple-50"
        >
          <Activity className="h-4 w-4" />
          Log Cardio
        </Button>
        
        <Button 
          onClick={() => setShowRestDialog(true)} 
          variant="outline"
          className="flex items-center justify-center gap-2 text-amber-600 border-amber-200 hover:bg-amber-50 col-span-2"
        >
          <Armchair className="h-4 w-4" />
          Log Rest Day
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
