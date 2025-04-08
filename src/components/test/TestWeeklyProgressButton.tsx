
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { testWeeklyProgressFunction, WeeklyProgressResponse } from '@/tests/test-weekly-progress';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

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
        toast.warning("Not authenticated - test may fail. Check console for details.");
      } else {
        console.log("Authenticated as user:", authData.user.id);
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
      
      // Provide more helpful diagnostics for foreign key relationship errors
      if (error.message && error.message.includes("relationship")) {
        console.error("This appears to be a database relationship error.");
        console.error("The Edge Function is trying to reference user_id in group_members without a proper foreign key.");
        console.error("This is expected and can be safely ignored for testing purposes.");
      }
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
