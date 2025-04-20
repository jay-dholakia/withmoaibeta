import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { format } from 'date-fns';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Pencil, Save, Plus, X, Loader2 } from 'lucide-react';

interface JournalEntry {
  id: string;
  content: string;
  created_at: string;
  updated_at?: string;
  entry_date?: string;
  emoji?: string;
}

interface WorkoutJournalSectionProps {
  date: Date;
}

const WorkoutJournalSection: React.FC<WorkoutJournalSectionProps> = ({ date }) => {
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [newContent, setNewContent] = useState('');
  const { user } = useAuth();

  useEffect(() => {
    if (!user?.id || !date) return;

    const loadEntries = async () => {
      setIsLoading(true);
      try {
        const startOfDay = new Date(date);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(date);
        endOfDay.setHours(23, 59, 59, 999);

        const { data, error } = await supabase
          .from('client_notes')
          .select('*')
          .eq('user_id', user.id)
          .gte('entry_date', startOfDay.toISOString())
          .lt('entry_date', endOfDay.toISOString())
          .order('created_at', { ascending: false });

        if (error) throw error;
        setEntries(data || []);
      } catch (error) {
        console.error('Error loading journal entries:', error);
        toast.error('Failed to load journal entries');
      } finally {
        setIsLoading(false);
      }
    };

    loadEntries();
  }, [date, user?.id]);

  const stripEmoji = (text: string) => {
    const match = text.match(/^([\u{1F600}-\u{1F6FF}]+)/gu);
    return match ? match[0] : '';
  };

  const removeEmoji = (text: string) => {
    return text.replace(/^[\u{1F600}-\u{1F6FF}]+/gu, '').trim();
  };

  const handleStartEdit = (entry: JournalEntry) => {
    setEditContent(entry.content);
    setEditingId(entry.id);
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setEditContent('');
    setEditingId(null);
    setIsEditing(false);
  };

  const handleSaveEdit = async () => {
    if (!editingId || !editContent.trim()) return;

    try {
      const { error } = await supabase
        .from('client_notes')
        .update({
          content: editContent,
          updated_at: new Date().toISOString()
        })
        .eq('id', editingId);

      if (error) throw error;

      setEntries(entries.map(entry =>
        entry.id === editingId
          ? { ...entry, content: editContent, updated_at: new Date().toISOString() }
          : entry
      ));
      
      setEditContent('');
      setEditingId(null);
      setIsEditing(false);
      toast.success('Journal entry updated');
    } catch (error) {
      console.error('Error updating journal entry:', error);
      toast.error('Failed to update journal entry');
    }
  };

  const handleStartCreate = () => {
    setIsCreating(true);
    setNewContent('');
  };

  const handleCancelCreate = () => {
    setIsCreating(false);
    setNewContent('');
  };

  const handleCreate = async () => {
    if (!newContent.trim() || !user?.id) return;

    try {
      const { data, error } = await supabase
        .from('client_notes')
        .insert({
          content: newContent,
          user_id: user.id,
          entry_date: date.toISOString()
        })
        .select()
        .single();

      if (error) throw error;

      setEntries([data, ...entries]);
      setIsCreating(false);
      setNewContent('');
      toast.success('Journal entry added');
    } catch (error) {
      console.error('Error creating journal entry:', error);
      toast.error('Failed to add journal entry');
    }
  };

  return (
    <Card className="mt-6">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-xl">Journal Entries</CardTitle>
        {!isCreating && !isEditing && (
          <Button onClick={handleStartCreate} className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Add Entry
          </Button>
        )}
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center p-4">
            <Loader2 className="h-6 w-6 animate-spin text-client" />
          </div>
        ) : (
          <div className="space-y-4">
            {isCreating && (
              <div className="space-y-2">
                <Textarea
                  value={newContent}
                  onChange={(e) => setNewContent(e.target.value)}
                  placeholder="Write your journal entry here..."
                  className="min-h-[150px]"
                />
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={handleCancelCreate}>
                    <X className="h-4 w-4 mr-1" />
                    Cancel
                  </Button>
                  <Button onClick={handleCreate}>
                    <Plus className="h-4 w-4 mr-1" />
                    Add Entry
                  </Button>
                </div>
              </div>
            )}

            {entries.map((entry) => (
              <div key={entry.id} className="border rounded-lg p-4 mb-2">
                {editingId === entry.id ? (
                  <div className="space-y-2">
                    <Textarea
                      value={editContent}
                      onChange={(e) => setEditContent(e.target.value)}
                      placeholder="Write your journal entry here..."
                      className="min-h-[150px]"
                    />
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" onClick={handleCancelEdit}>
                        <X className="h-4 w-4 mr-1" />
                        Cancel
                      </Button>
                      <Button onClick={handleSaveEdit}>
                        <Save className="h-4 w-4 mr-1" />
                        Save
                      </Button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="flex justify-end">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleStartEdit(entry)}
                        className="h-8 px-2"
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                    </div>
                    <p className="whitespace-pre-wrap">
                      <span className="mr-2 text-lg">{stripEmoji(entry.content)}</span>
                      {removeEmoji(entry.content)}
                    </p>
                  </>
                )}
              </div>
            ))}

            {!isCreating && entries.length === 0 && (
              <div className="text-center text-muted-foreground py-8">
                No journal entries for this date.
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default WorkoutJournalSection;
