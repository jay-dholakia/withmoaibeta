
import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

const BetaFeedbackCard = () => {
  const { user } = useAuth();
  const [feedback, setFeedback] = useState("Spill any thoughts, feedback, and/or bugs experienced while using the app :) The more critical the better!");
  const [isSaving, setIsSaving] = useState(false);

  const handleSubmit = async () => {
    if (!user?.id) return;
    if (!feedback.trim() || feedback === "Spill any thoughts, feedback, and/or bugs experienced while using the app :) The more critical the better!") {
      toast.error('Please enter some feedback');
      return;
    }
    
    setIsSaving(true);
    try {
      // Always insert new feedback
      const { error } = await supabase
        .from('beta_feedback')
        .insert({ user_id: user.id, feedback });
        
      if (error) throw error;
      
      toast.success('Feedback submitted successfully');
      // Reset the feedback text
      setFeedback("Spill any thoughts, feedback, and/or bugs experienced while using the app :) The more critical the better!");
    } catch (error) {
      console.error('Error saving feedback:', error);
      toast.error('Failed to save feedback');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Card className="dark:bg-gray-800 dark:border-gray-700">
      <CardHeader>
        <CardTitle className="dark:text-gray-100">Beta Feedback</CardTitle>
        <CardDescription className="dark:text-gray-300">Help us improve the app by sharing your thoughts</CardDescription>
      </CardHeader>
      <CardContent>
        <Textarea
          value={feedback}
          onChange={(e) => setFeedback(e.target.value)}
          className="min-h-[150px] dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600"
          placeholder="Spill any thoughts, feedback, and/or bugs experienced while using the app :) The more critical the better!"
          onFocus={(e) => {
            // Clear placeholder text on focus if it's the default text
            if (feedback === "Spill any thoughts, feedback, and/or bugs experienced while using the app :) The more critical the better!") {
              setFeedback('');
            }
          }}
        />
      </CardContent>
      <CardFooter>
        <Button 
          onClick={handleSubmit} 
          className="w-full bg-client hover:bg-client/90 dark:bg-blue-600 dark:hover:bg-blue-700 dark:text-white"
          disabled={isSaving}
        >
          {isSaving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...
            </>
          ) : (
            'Submit Feedback'
          )}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default BetaFeedbackCard;
