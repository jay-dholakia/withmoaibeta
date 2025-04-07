
import React from 'react';
import { Button } from '@/components/ui/button';
import { testWeeklyProgressFunction } from '@/tests/test-weekly-progress';
import { toast } from 'sonner';

export const TestWeeklyProgressButton = () => {
  const handleTestClick = async () => {
    toast.info("Starting test of get_weekly_progress function...");
    
    try {
      await testWeeklyProgressFunction();
      toast.success("Test completed - check console for results");
    } catch (error) {
      toast.error("Test failed - check console for details");
      console.error("Test error:", error);
    }
  };

  return (
    <Button 
      onClick={handleTestClick}
      variant="outline"
      className="bg-gray-100 hover:bg-gray-200"
    >
      Test Weekly Progress Function
    </Button>
  );
};
