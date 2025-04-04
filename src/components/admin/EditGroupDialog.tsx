
import React from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { updateGroup } from '@/services/group-service';

interface Group {
  id: string;
  name: string;
  description: string | null;
  spotify_playlist_url?: string | null;
  program_type?: string | null;
}

interface EditGroupDialogProps {
  group: Group | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

const formSchema = z.object({
  name: z.string().min(1, 'Group name is required'),
  description: z.string().optional(),
  spotify_playlist_url: z.string().url('Please enter a valid URL').optional().or(z.literal('')),
  program_type: z.string().min(1, 'Program type is required'),
});

type FormValues = z.infer<typeof formSchema>;

const EditGroupDialog: React.FC<EditGroupDialogProps> = ({
  group,
  open,
  onOpenChange,
  onSuccess,
}) => {
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: group?.name || '',
      description: group?.description || '',
      spotify_playlist_url: group?.spotify_playlist_url || '',
      program_type: group?.program_type || 'strength',
    },
  });

  // Update form values when group changes
  React.useEffect(() => {
    if (group) {
      form.reset({
        name: group.name,
        description: group.description || '',
        spotify_playlist_url: group.spotify_playlist_url || '',
        program_type: group.program_type || 'strength',
      });
    }
  }, [group, form]);

  const onSubmit = async (values: FormValues) => {
    if (!group) return;

    try {
      const result = await updateGroup(group.id, {
        name: values.name,
        description: values.description,
        spotify_playlist_url: values.spotify_playlist_url || null,
        program_type: values.program_type,
      });

      if (result.success) {
        toast.success('Group updated successfully');
        onOpenChange(false);
        onSuccess();
      } else {
        toast.error(result.message || 'Failed to update group');
      }
    } catch (error) {
      console.error('Error updating group:', error);
      toast.error('An unexpected error occurred');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Edit Group</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-2">
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
              name="program_type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Group Type</FormLabel>
                  <Select 
                    onValueChange={field.onChange} 
                    defaultValue={field.value}
                    value={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a group type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="strength">Strength</SelectItem>
                      <SelectItem value="run">Run</SelectItem>
                    </SelectContent>
                  </Select>
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
                      placeholder="Enter group description"
                      className="resize-none"
                      {...field}
                    />
                  </FormControl>
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

            <DialogFooter className="pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? 'Saving...' : 'Save Changes'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default EditGroupDialog;
