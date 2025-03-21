
import React, { useState } from 'react';
import { Pencil, Save, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';

const NotesPage = () => {
  const [notes, setNotes] = useState<{ id: number; content: string; date: string; editing: boolean }[]>(() => {
    const savedNotes = localStorage.getItem('clientNotes');
    return savedNotes ? JSON.parse(savedNotes) : [
      { id: 1, content: 'Welcome to your notes! This is where you can track your fitness journey.', date: new Date().toISOString(), editing: false }
    ];
  });
  
  const [newNote, setNewNote] = useState('');
  
  const handleSaveNotes = (updatedNotes: typeof notes) => {
    localStorage.setItem('clientNotes', JSON.stringify(updatedNotes));
    setNotes(updatedNotes);
  };
  
  const addNewNote = () => {
    if (!newNote.trim()) {
      toast.error('Note cannot be empty');
      return;
    }
    
    const updatedNotes = [
      {
        id: Date.now(),
        content: newNote,
        date: new Date().toISOString(),
        editing: false
      },
      ...notes
    ];
    
    handleSaveNotes(updatedNotes);
    setNewNote('');
    toast.success('Note added successfully');
  };
  
  const toggleEditMode = (id: number) => {
    const updatedNotes = notes.map(note => 
      note.id === id ? { ...note, editing: !note.editing } : note
    );
    setNotes(updatedNotes);
  };
  
  const updateNoteContent = (id: number, content: string) => {
    const updatedNotes = notes.map(note => 
      note.id === id ? { ...note, content } : note
    );
    setNotes(updatedNotes);
  };
  
  const saveNote = (id: number) => {
    const noteToSave = notes.find(note => note.id === id);
    if (noteToSave && !noteToSave.content.trim()) {
      toast.error('Note cannot be empty');
      return;
    }
    
    const updatedNotes = notes.map(note => 
      note.id === id ? { ...note, editing: false, date: new Date().toISOString() } : note
    );
    
    handleSaveNotes(updatedNotes);
    toast.success('Note updated successfully');
  };
  
  const deleteNote = (id: number) => {
    const updatedNotes = notes.filter(note => note.id !== id);
    handleSaveNotes(updatedNotes);
    toast.success('Note deleted successfully');
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
          <CardTitle>Add New Note</CardTitle>
          <CardDescription>
            Keep track of your fitness journey, goals, and achievements
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Textarea
            placeholder="Write your note here..."
            value={newNote}
            onChange={(e) => setNewNote(e.target.value)}
            className="min-h-[100px]"
          />
        </CardContent>
        <CardFooter className="flex justify-end">
          <Button onClick={addNewNote} className="flex items-center">
            <Plus className="mr-2 h-4 w-4" />
            Add Note
          </Button>
        </CardFooter>
      </Card>
      
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Your Notes</h2>
        
        {notes.length === 0 ? (
          <Card className="p-6 text-center text-muted-foreground">
            No notes yet. Add your first note above!
          </Card>
        ) : (
          <ScrollArea className="h-[400px] rounded-md border">
            <div className="p-4 space-y-4">
              {notes.map((note) => (
                <Card key={note.id} className="group">
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <CardTitle className="text-sm text-muted-foreground">
                        {formatDate(note.date)}
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
