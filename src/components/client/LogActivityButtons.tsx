
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { LogRunActivityDialog } from './LogRunActivityDialog';
import { LogCardioActivityDialog } from './LogCardioActivityDialog';
import { LogRestDayDialog } from './LogRestDayDialog';
import { Plus } from 'lucide-react';

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
          className="flex items-center justify-between text-blue-600 border-blue-200 hover:bg-blue-50"
        >
          <div className="flex items-center">
            <Plus className="h-4 w-4 mr-2" />
            <span>Log Run</span>
          </div>
          <span className="ml-auto">🏃</span>
        </Button>
        
        <Button 
          onClick={() => setShowCardioDialog(true)}
          variant="outline"
          className="flex items-center justify-between text-purple-600 border-purple-200 hover:bg-purple-50"
        >
          <div className="flex items-center">
            <Plus className="h-4 w-4 mr-2" />
            <span>Log Cardio Cross Training</span>
          </div>
          <span className="ml-auto">🚴</span>
        </Button>
        
        <Button 
          onClick={() => setShowRestDialog(true)} 
          variant="outline"
          className="flex items-center justify-between text-amber-600 border-amber-200 hover:bg-amber-50"
        >
          <div className="flex items-center">
            <Plus className="h-4 w-4 mr-2" />
            <span>Log Rest Day</span>
          </div>
          <span className="ml-auto">😴</span>
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
