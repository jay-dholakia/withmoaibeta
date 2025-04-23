
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Plus, Save, X } from 'lucide-react';
import { Link } from 'react-router-dom';

const DashboardJournalSection = () => {
  const [isCreating, setIsCreating] = useState(false);
  const [newContent, setNewContent] = useState('');
  const [recentEntries, setRecentEntries] = useState<any[]>([]);
  const { user } = useAuth();

  useEffect(() => {
    if (!user?.id) return;
    
    const loadRecentEntries = async () => {
      try {
        const { data, error } = await supabase
          .from('client_notes')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(3);

        if (error) throw error;
        setRecentEntries(data || []);
      } catch (error) {
        console.error('Error loading journal entries:', error);
        toast.error('Failed to load recent journal entries');
      }
    };

    loadRecentEntries();
  }, [user?.id]);

  const handleCreate = async () => {
    if (!newContent.trim() || !user?.id) return;

    try {
      const { data, error } = await supabase
        .from('client_notes')
        .insert({
          content: newContent,
          user_id: user.id,
          entry_date: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;

      setRecentEntries([data, ...recentEntries.slice(0, 2)]);
      setIsCreating(false);
      setNewContent('');
      toast.success('Journal entry added');
    } catch (error) {
      console.error('Error creating journal entry:', error);
      toast.error('Failed to add journal entry');
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg">Today's Journal</CardTitle>
        <div className="flex gap-2">
          {!isCreating && (
            <>
              <Button onClick={() => setIsCreating(true)} variant="outline" size="sm" className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                New Entry
              </Button>
              <Button asChild variant="ghost" size="sm">
                <Link to="/client-dashboard/workouts">View All</Link>
              </Button>
            </>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {isCreating ? (
          <div className="space-y-2">
            <Textarea
              value={newContent}
              onChange={(e) => setNewContent(e.target.value)}
              placeholder="Write your journal entry here..."
              className="min-h-[100px]"
            />
            <div className="flex justify-end gap-2">
              <Button variant="outline" size="sm" onClick={() => setIsCreating(false)}>
                <X className="h-4 w-4 mr-1" />
                Cancel
              </Button>
              <Button size="sm" onClick={handleCreate}>
                <Save className="h-4 w-4 mr-1" />
                Save
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {recentEntries.length > 0 ? (
              recentEntries.map((entry) => (
                <div key={entry.id} className="border rounded-lg p-4">
                  <p className="whitespace-pre-wrap">{entry.content}</p>
                </div>
              ))
            ) : (
              <div className="text-center text-muted-foreground py-4">
                No recent journal entries. Click "New Entry" to create one.
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default DashboardJournalSection;
