import React, { useState, useEffect } from 'react';
import { Pencil, Save, Plus, Trash2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

interface Note {
  id: string;
  content: string;
  created_at: string;
  updated_at?: string;
  editing: boolean;
}

const NotesPage = () => {
  const [notes, setNotes] = useState<Note[]>([]);
  const [newNote, setNewNote] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();
  
  useEffect(() => {
    if (!user) return;
    
    const fetchNotes = async () => {
      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from('client_notes')
          .select('*')
          .order('created_at', { ascending: false });
          
        if (error) throw error;
        
        const notesWithEditState = data.map(note => ({
          ...note,
          editing: false
        }));
        
        setNotes(notesWithEditState);
      } catch (error) {
        console.error('Error fetching notes:', error);
        toast.error('Failed to load notes');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchNotes();
  }, [user]);
  
  const addNewNote = async () => {
    if (!user) {
      toast.error('You must be logged in to add notes');
      return;
    }
    
    if (!newNote.trim()) {
      toast.error('Note cannot be empty');
      return;
    }
    
    try {
      const { data, error } = await supabase
        .from('client_notes')
        .insert({
          user_id: user.id,
          content: newNote
        })
        .select()
        .single();
      
      if (error) throw error;
      
      setNotes([
        {
          ...data,
          editing: false
        },
        ...notes
      ]);
      
      setNewNote('');
      toast.success('Note added successfully');
    } catch (error) {
      console.error('Error adding note:', error);
      toast.error('Failed to add note');
    }
  };
  
  const toggleEditMode = (id: string) => {
    const updatedNotes = notes.map(note => 
      note.id === id ? { ...note, editing: !note.editing } : note
    );
    setNotes(updatedNotes);
  };
  
  const updateNoteContent = (id: string, content: string) => {
    const updatedNotes = notes.map(note => 
      note.id === id ? { ...note, content } : note
    );
    setNotes(updatedNotes);
  };
  
  const saveNote = async (id: string) => {
    const noteToSave = notes.find(note => note.id === id);
    
    if (!noteToSave) {
      toast.error('Note not found');
      return;
    }
    
    if (!noteToSave.content.trim()) {
      toast.error('Note cannot be empty');
      return;
    }
    
    try {
      const { error } = await supabase
        .from('client_notes')
        .update({ 
          content: noteToSave.content,
          updated_at: new Date().toISOString()
        })
        .eq('id', id);
      
      if (error) throw error;
      
      const updatedNotes = notes.map(note => 
        note.id === id ? { ...note, editing: false, updated_at: new Date().toISOString() } : note
      );
      
      setNotes(updatedNotes);
      toast.success('Note updated successfully');
    } catch (error) {
      console.error('Error updating note:', error);
      toast.error('Failed to update note');
    }
  };
  
  const deleteNote = async (id: string) => {
    try {
      const { error } = await supabase
        .from('client_notes')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      
      const updatedNotes = notes.filter(note => note.id !== id);
      setNotes(updatedNotes);
      toast.success('Note deleted successfully');
    } catch (error) {
      console.error('Error deleting note:', error);
      toast.error('Failed to delete note');
    }
  };
  
  const formatDate = (dateString: string) => {
    const options: Intl.DateTimeFormatOptions = { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Add Journal Entry</CardTitle>
          <CardDescription>
            Keep track of your fitness journey, goals, achievements, or log your food
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Textarea
            placeholder="Write your journal entry here..."
            value={newNote}
            onChange={(e) => setNewNote(e.target.value)}
            className="min-h-[100px]"
          />
        </CardContent>
        <CardFooter className="flex justify-end">
          <Button onClick={addNewNote} className="flex items-center">
            <Plus className="mr-2 h-4 w-4" />
            Add Entry
          </Button>
        </CardFooter>
      </Card>
      
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Your Journal</h2>
        
        {isLoading ? (
          <div className="flex justify-center p-12">
            <Loader2 className="h-8 w-8 animate-spin text-client" />
          </div>
        ) : notes.length === 0 ? (
          <Card className="p-6 text-center text-muted-foreground">
            No entries yet. Add your first journal entry above!
          </Card>
        ) : (
          <ScrollArea className="h-[400px] rounded-md border">
            <div className="p-4 space-y-4">
              {notes.map((note) => (
                <Card key={note.id} className="group">
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <CardTitle className="text-sm text-muted-foreground">
                        {formatDate(note.created_at)}
                      </CardTitle>
                      <div className="flex space-x-1">
                        {note.editing ? (
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => saveNote(note.id)}
                            className="h-7 w-7 text-green-500 hover:text-green-700"
                          >
                            <Save className="h-4 w-4" />
                          </Button>
                        ) : (
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => toggleEditMode(note.id)}
                            className="h-7 w-7 text-blue-500 hover:text-blue-700"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                        )}
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => deleteNote(note.id)}
                          className="h-7 w-7 text-red-500 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {note.editing ? (
                      <Textarea
                        value={note.content}
                        onChange={(e) => updateNoteContent(note.id, e.target.value)}
                        className="min-h-[100px]"
                      />
                    ) : (
                      <p className="whitespace-pre-wrap">{note.content}</p>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </ScrollArea>
        )}
      </div>
    </div>
  );
};

export default NotesPage;
