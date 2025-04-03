
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
import { updateGroup } from '@/services/group-service';

interface Group {
  id: string;
  name: string;
  description: string | null;
  spotify_playlist_url?: string | null;
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
    },
  });

  // Update form values when group changes
  React.useEffect(() => {
    if (group) {
      form.reset({
        name: group.name,
        description: group.description || '',
        spotify_playlist_url: group.spotify_playlist_url || '',
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
