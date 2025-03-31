
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

const BetaFeedbackCard = () => {
  const { user } = useAuth();
  const [feedback, setFeedback] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [hasFeedback, setHasFeedback] = useState(false);

  // Fetch existing feedback
  useEffect(() => {
    const fetchFeedback = async () => {
      if (!user?.id) return;
      
      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from('beta_feedback')
          .select('feedback')
          .eq('user_id', user.id)
          .maybeSingle();
          
        if (error) throw error;
        
        if (data) {
          setFeedback(data.feedback);
          setHasFeedback(true);
        } else {
          setFeedback("Spill any thoughts, feedback, and/or bugs experienced while using the app :) The more critical the better!");
          setHasFeedback(false);
        }
      } catch (error) {
        console.error('Error fetching feedback:', error);
        toast.error('Failed to load feedback');
      } finally {
        setIsLoading(false);
      }
    };

    fetchFeedback();
  }, [user?.id]);

  const handleSubmit = async () => {
    if (!user?.id) return;
    if (!feedback.trim()) {
      toast.error('Please enter some feedback');
      return;
    }
    
    setIsSaving(true);
    try {
      if (hasFeedback) {
        // Update existing feedback
        const { error } = await supabase
          .from('beta_feedback')
          .update({ feedback })
          .eq('user_id', user.id);
          
        if (error) throw error;
        
        toast.success('Feedback updated successfully');
      } else {
        // Insert new feedback
        const { error } = await supabase
          .from('beta_feedback')
          .insert({ user_id: user.id, feedback });
          
        if (error) throw error;
        
        setHasFeedback(true);
        toast.success('Feedback submitted successfully');
      }
    } catch (error) {
      console.error('Error saving feedback:', error);
      toast.error('Failed to save feedback');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Beta Feedback</CardTitle>
          <CardDescription>Help us improve the app by sharing your thoughts</CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center items-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Beta Feedback</CardTitle>
        <CardDescription>Help us improve the app by sharing your thoughts</CardDescription>
      </CardHeader>
      <CardContent>
        <Textarea
          value={feedback}
          onChange={(e) => setFeedback(e.target.value)}
          className="min-h-[150px]"
          placeholder="Spill any thoughts, feedback, and/or bugs experienced while using the app :) The more critical the better!"
          onFocus={(e) => {
            // Clear placeholder text on first focus if it's the default text
            if (!hasFeedback && feedback === "Spill any thoughts, feedback, and/or bugs experienced while using the app :) The more critical the better!") {
              setFeedback('');
            }
          }}
        />
      </CardContent>
      <CardFooter>
        <Button 
          onClick={handleSubmit} 
          className="w-full bg-client hover:bg-client/90"
          disabled={isSaving}
        >
          {isSaving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...
            </>
          ) : (
            hasFeedback ? 'Update Feedback' : 'Submit Feedback'
          )}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default BetaFeedbackCard;
