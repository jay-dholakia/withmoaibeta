
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { testWeeklyProgressFunction, WeeklyProgressResponse } from '@/tests/test-weekly-progress';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

export const TestWeeklyProgressButton = () => {
  const [isLoading, setIsLoading] = useState(false);
  
  const handleTestClick = async () => {
    setIsLoading(true);
    toast.info("Starting test of get_weekly_progress function...");
    
    try {
      // Verify authentication state before calling the function
      const { data: authData } = await supabase.auth.getUser();
      if (!authData?.user) {
        console.warn("User is not authenticated. Test may fail if the function requires authentication.");
      }
      
      const result = await testWeeklyProgressFunction();
      
      if (result.error) {
        toast.warning(`Test completed with warnings - check console for details (Error: ${result.error})`);
      } else {
        toast.success("Test completed successfully - check console for results");
      }
    } catch (error) {
      toast.error(`Test failed - ${error.message || "Unknown error"}`);
      console.error("Test error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button 
      onClick={handleTestClick}
      variant="outline"
      className="bg-gray-100 hover:bg-gray-200"
      disabled={isLoading}
    >
      {isLoading ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Running Test...
        </>
      ) : (
        "Test Weekly Progress Function"
      )}
    </Button>
  );
};
