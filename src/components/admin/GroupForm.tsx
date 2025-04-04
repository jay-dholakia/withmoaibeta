
import React from 'react';
import { useForm } from 'react-hook-form';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAuth } from '@/contexts/AuthContext';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { createGroupForCoach } from '@/services/group-service';

const groupFormSchema = z.object({
  name: z.string().min(1, 'Group name is required').max(100, 'Group name is too long'),
  description: z.string().optional(),
  spotify_playlist_url: z.string().url('Please enter a valid URL').optional().or(z.literal('')),
  program_type: z.enum(['strength', 'run']),
});

type GroupFormValues = z.infer<typeof groupFormSchema>;

const GroupForm: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const form = useForm<GroupFormValues>({
    resolver: zodResolver(groupFormSchema),
    defaultValues: {
      name: '',
      description: '',
      spotify_playlist_url: '',
      program_type: 'strength',
    }
  });
  
  const onSubmit = async (values: GroupFormValues) => {
    if (!user?.id) {
      toast.error('You must be logged in to create a group');
      return;
    }
    
    try {
      const result = await createGroupForCoach(
        user.id,
        values.name,
        values.description,
        values.spotify_playlist_url,
        values.program_type
      );
      
      if (result.success) {
        toast.success('Group created successfully');
        navigate('/admin-dashboard/groups', { replace: true });
      } else {
        toast.error(result.message || 'Failed to create group');
      }
    } catch (error) {
      console.error('Error creating group:', error);
      toast.error('Failed to create group');
    }
  };
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Create New Group</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Group Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter group name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description (Optional)</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Enter a description for this group" 
                      {...field} 
                      value={field.value || ''}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="program_type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Program Type</FormLabel>
                  <Select 
                    onValueChange={field.onChange} 
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select program type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="strength">Moai Strength</SelectItem>
                      <SelectItem value="run">Moai Run</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="spotify_playlist_url"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Spotify Playlist URL (Optional)</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="https://open.spotify.com/playlist/..." 
                      {...field} 
                      value={field.value || ''}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="flex justify-end gap-2">
              <Button 
                type="button" 
                variant="outline"
                onClick={() => navigate('/admin-dashboard/groups')}
              >
                Cancel
              </Button>
              <Button type="submit">Create Group</Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};

export default GroupForm;
