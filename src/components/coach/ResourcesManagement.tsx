
import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { 
  Form, 
  FormControl, 
  FormDescription, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { 
  Pencil, 
  Trash2, 
  Plus, 
  ExternalLink, 
  Loader2, 
  AlertCircle,
  Book,
  Calendar,
  Info,
  Link as LinkIcon
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { 
  fetchCoachResources, 
  addCoachResource, 
  updateCoachResource, 
  deleteCoachResource,
  CoachResource
} from '@/services/coach-resource-service';

const resourceSchema = z.object({
  title: z.string().min(1, "Title is required").max(100, "Title is too long"),
  description: z.string().nullable().optional(),
  url: z.string().url("Must be a valid URL"),
});

type ResourceFormValues = z.infer<typeof resourceSchema>;

const ResourcesManagement = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [editingResource, setEditingResource] = useState<CoachResource | null>(null);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  const form = useForm<ResourceFormValues>({
    resolver: zodResolver(resourceSchema),
    defaultValues: {
      title: '',
      description: '',
      url: '',
    },
  });

  useEffect(() => {
    if (editingResource && isEditDialogOpen) {
      form.reset({
        title: editingResource.title,
        description: editingResource.description || '',
        url: editingResource.url,
      });
    } else if (!isEditDialogOpen && !isAddDialogOpen) {
      form.reset({
        title: '',
        description: '',
        url: '',
      });
    }
  }, [editingResource, isEditDialogOpen, isAddDialogOpen, form]);

  const { data: resources, isLoading, error } = useQuery({
    queryKey: ['coach-resources', user?.id],
    queryFn: () => {
      if (!user?.id) throw new Error('Not authenticated');
      return fetchCoachResources(user.id);
    },
    enabled: !!user?.id,
  });

  const addResourceMutation = useMutation({
    mutationFn: async (values: ResourceFormValues) => {
      if (!user?.id) throw new Error('Not authenticated');
      return addCoachResource({
        coach_id: user.id,
        title: values.title,
        description: values.description || null,
        url: values.url,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['coach-resources', user?.id],
      });
      toast.success('Resource added successfully');
      setIsAddDialogOpen(false);
      form.reset();
    },
    onError: (error) => {
      toast.error('Failed to add resource: ' + (error as Error).message);
    },
  });

  const updateResourceMutation = useMutation({
    mutationFn: async ({ id, values }: { id: string; values: ResourceFormValues }) => {
      if (!user?.id) throw new Error('Not authenticated');
      return updateCoachResource(id, user.id, {
        title: values.title,
        description: values.description || null,
        url: values.url,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['coach-resources', user?.id],
      });
      toast.success('Resource updated successfully');
      setIsEditDialogOpen(false);
      setEditingResource(null);
    },
    onError: (error) => {
      toast.error('Failed to update resource: ' + (error as Error).message);
    },
  });

  const deleteResourceMutation = useMutation({
    mutationFn: async (id: string) => {
      if (!user?.id) throw new Error('Not authenticated');
      return deleteCoachResource(id, user.id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['coach-resources', user?.id],
      });
      toast.success('Resource deleted successfully');
    },
    onError: (error) => {
      toast.error('Failed to delete resource: ' + (error as Error).message);
    },
  });

  const onSubmit = (values: ResourceFormValues) => {
    if (editingResource) {
      updateResourceMutation.mutate({ id: editingResource.id, values });
    } else {
      addResourceMutation.mutate(values);
    }
  };

  const handleEdit = (resource: CoachResource) => {
    setEditingResource(resource);
    setIsEditDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    deleteResourceMutation.mutate(id);
  };

  const getIconForResource = (url: string) => {
    if (url.includes('calendar') || url.includes('event') || url.includes('schedule')) {
      return <Calendar className="h-4 w-4 text-blue-500" />;
    } else if (url.includes('book') || url.includes('pdf') || url.includes('doc')) {
      return <Book className="h-4 w-4 text-emerald-500" />;
    } else if (url.includes('info') || url.includes('about') || url.includes('faq')) {
      return <Info className="h-4 w-4 text-amber-500" />;
    } else {
      return <LinkIcon className="h-4 w-4 text-purple-500" />;
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="pt-6 flex justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-coach" />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="pt-6 flex flex-col items-center justify-center py-12">
          <AlertCircle className="h-8 w-8 text-red-500 mb-2" />
          <p className="text-muted-foreground">Error loading resources</p>
          <p className="text-sm text-muted-foreground">{(error as Error).message}</p>
        </CardContent>
      </Card>
    );
  }

  const resourceForm = (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Title</FormLabel>
              <FormControl>
                <Input placeholder="Enter resource title" {...field} />
              </FormControl>
              <FormDescription>
                A short descriptive title for the resource
              </FormDescription>
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
                  placeholder="Enter a brief description of this resource"
                  {...field}
                  value={field.value || ''}
                />
              </FormControl>
              <FormDescription>
                Provide some context about this resource
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="url"
          render={({ field }) => (
            <FormItem>
              <FormLabel>URL</FormLabel>
              <FormControl>
                <Input placeholder="https://example.com/resource" {...field} />
              </FormControl>
              <FormDescription>
                The full URL to the resource
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="outline">Cancel</Button>
          </DialogClose>
          <Button 
            type="submit"
            disabled={addResourceMutation.isPending || updateResourceMutation.isPending}
          >
            {(addResourceMutation.isPending || updateResourceMutation.isPending) && (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            )}
            {editingResource ? 'Update Resource' : 'Add Resource'}
          </Button>
        </DialogFooter>
      </form>
    </Form>
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex justify-between items-center">
          <span>Coach's Corner</span>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="flex items-center gap-1">
                <Plus className="h-4 w-4" />
                <span>Add Resource</span>
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Resource</DialogTitle>
                <DialogDescription>
                  Add a helpful resource for your clients to access
                </DialogDescription>
              </DialogHeader>
              {resourceForm}
            </DialogContent>
          </Dialog>
        </CardTitle>
        <CardDescription>
          Manage helpful resources you want to share with your clients
        </CardDescription>
      </CardHeader>
      <CardContent>
        {!resources || resources.length === 0 ? (
          <div className="text-center py-8 bg-muted/30 rounded-md">
            <p className="text-muted-foreground mb-4">You haven't added any resources yet</p>
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-coach hover:bg-coach/90 flex items-center gap-1">
                  <Plus className="h-4 w-4" />
                  <span>Add Your First Resource</span>
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add New Resource</DialogTitle>
                  <DialogDescription>
                    Add a helpful resource for your clients to access
                  </DialogDescription>
                </DialogHeader>
                {resourceForm}
              </DialogContent>
            </Dialog>
          </div>
        ) : (
          <div className="space-y-4">
            {resources.map((resource, index) => (
              <React.Fragment key={resource.id}>
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 p-1.5 bg-muted rounded-md">
                    {getIconForResource(resource.url)}
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between">
                      <h4 className="font-medium">{resource.title}</h4>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-foreground"
                          onClick={() => handleEdit(resource)}
                        >
                          <Pencil className="h-4 w-4" />
                          <span className="sr-only">Edit</span>
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-muted-foreground hover:text-red-500"
                            >
                              <Trash2 className="h-4 w-4" />
                              <span className="sr-only">Delete</span>
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete Resource</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to delete this resource? This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                className="bg-red-500 hover:bg-red-600"
                                onClick={() => handleDelete(resource.id)}
                              >
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                    {resource.description && (
                      <p className="text-sm text-muted-foreground mt-1">{resource.description}</p>
                    )}
                    <Button
                      variant="link"
                      className="h-8 px-0 text-blue-600 flex items-center gap-1"
                      asChild
                    >
                      <a href={resource.url} target="_blank" rel="noopener noreferrer">
                        {resource.url.length > 40 ? `${resource.url.substring(0, 40)}...` : resource.url}
                        <ExternalLink className="h-3 w-3 ml-1" />
                      </a>
                    </Button>
                  </div>
                </div>
                {index < resources.length - 1 && <Separator />}
              </React.Fragment>
            ))}
          </div>
        )}
      </CardContent>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Resource</DialogTitle>
            <DialogDescription>
              Update the details of this resource
            </DialogDescription>
          </DialogHeader>
          {resourceForm}
        </DialogContent>
      </Dialog>
    </Card>
  );
};

export default ResourcesManagement;
