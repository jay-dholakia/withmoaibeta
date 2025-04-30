
import React, { useState, useEffect, useCallback, memo } from 'react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Card,
  CardContent,
  CardDescription,
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
import { Checkbox } from '@/components/ui/checkbox';
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
  Link as LinkIcon,
  Tag
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger
} from '@/components/ui/alert-dialog';
import { useResourceManagement, ResourceFormValues } from '@/hooks/useResourceManagement';

const RESOURCE_TAGS = [
  "Recovery", "Hydration", "Energy Gels", "Shoes", "Running Belts", "Energy Chews",
  "Electrolytes", "Nutrition", "Strength Training", "Mobility", "Stretching", "Race Day"
];

const resourceSchema = z.object({
  title: z.string().min(1, "Title is required").max(100, "Title is too long"),
  description: z.string().nullable().optional(),
  url: z.string().optional().nullable().or(z.literal('')),
  tags: z.array(z.string()).optional().nullable()
});

// Memoize the ResourceForm component to prevent unnecessary re-renders
const ResourceForm = memo(({ 
  form, 
  onSubmit, 
  isSubmitting, 
  isEditing 
}: { 
  form: any, 
  onSubmit: (values: ResourceFormValues) => void, 
  isSubmitting: boolean, 
  isEditing: boolean 
}) => {
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Title</FormLabel>
              <FormControl>
                <Input placeholder="Resource title" {...field} />
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
              <FormLabel>Description (optional)</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="Brief description of the resource" 
                  {...field} 
                  value={field.value || ''} 
                />
              </FormControl>
              <FormDescription>
                Briefly describe what this resource is about
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
              <FormLabel>URL (optional)</FormLabel>
              <FormControl>
                <Input placeholder="https://example.com" {...field} value={field.value || ''} />
              </FormControl>
              <FormDescription>
                Link to the resource
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="tags"
          render={() => (
            <FormItem>
              <div className="mb-4">
                <FormLabel>Tags (optional)</FormLabel>
                <FormDescription>
                  Select tags that best describe this resource
                </FormDescription>
              </div>
              <div className="flex flex-wrap gap-2">
                {RESOURCE_TAGS.map((tag) => (
                  <FormField
                    key={tag}
                    control={form.control}
                    name="tags"
                    render={({ field }) => {
                      return (
                        <FormItem
                          key={tag}
                          className="flex flex-row items-start space-x-2 space-y-0"
                        >
                          <FormControl>
                            <Checkbox
                              checked={field.value?.includes(tag)}
                              onCheckedChange={(checked) => {
                                const currentValue = field.value || [];
                                const updatedTags = checked
                                  ? [...currentValue, tag]
                                  : currentValue.filter((value) => value !== tag);
                                field.onChange(updatedTags);
                              }}
                            />
                          </FormControl>
                          <FormLabel className="font-normal cursor-pointer">
                            {tag}
                          </FormLabel>
                        </FormItem>
                      );
                    }}
                  />
                ))}
              </div>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end pt-2">
          <DialogClose asChild>
            <Button type="button" variant="outline" className="mr-2">
              Cancel
            </Button>
          </DialogClose>
          <Button 
            type="submit" 
            disabled={isSubmitting}
            className="flex items-center gap-1"
          >
            {isSubmitting && (
              <Loader2 className="h-4 w-4 animate-spin" />
            )}
            {isEditing ? 'Update Resource' : 'Add Resource'}
          </Button>
        </div>
      </form>
    </Form>
  );
});

ResourceForm.displayName = 'ResourceForm';

const ResourcesManagement = () => {
  const {
    resources,
    isLoading,
    error,
    editingResource,
    handleEdit,
    handleCancelEdit,
    addResource,
    updateResource,
    deleteResource,
    isAddingResource,
    isUpdatingResource
  } = useResourceManagement();
  
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  
  // Create a stable form reference that won't change on re-renders
  const form = useForm<ResourceFormValues>({
    resolver: zodResolver(resourceSchema),
    defaultValues: { title: '', description: '', url: '', tags: [] },
    mode: 'onChange'
  });

  // Reset the form only when the dialog state changes or the editing resource changes
  useEffect(() => {
    if (editingResource && isEditDialogOpen) {
      form.reset({
        title: editingResource.title,
        description: editingResource.description || '',
        url: editingResource.url || '',
        tags: editingResource.tags || []
      });
    } else if (!isEditDialogOpen && !isAddDialogOpen) {
      // Only reset when dialogs are closed, not on every render
      form.reset({ title: '', description: '', url: '', tags: [] });
    }
  }, [editingResource, isEditDialogOpen, isAddDialogOpen, form]);

  const onSubmit = useCallback((values: ResourceFormValues) => {
    if (editingResource) {
      updateResource({ id: editingResource.id, values });
    } else {
      addResource(values);
    }
  }, [editingResource, updateResource, addResource]);

  const handleOpenAddDialog = useCallback(() => {
    setIsAddDialogOpen(true);
  }, []);

  const handleOpenEditDialog = useCallback((resource) => {
    handleEdit(resource);
    setIsEditDialogOpen(true);
  }, [handleEdit]);

  const handleCloseAddDialog = useCallback(() => {
    setIsAddDialogOpen(false);
  }, []);

  const handleCloseEditDialog = useCallback(() => {
    setIsEditDialogOpen(false);
    handleCancelEdit();
  }, [handleCancelEdit]);

  const getIconForResource = useCallback((url: string | null) => {
    if (!url) return <Info className="h-4 w-4 text-amber-500" />;
    if (url.includes('calendar') || url.includes('event') || url.includes('schedule')) return <Calendar className="h-4 w-4 text-blue-500" />;
    if (url.includes('book') || url.includes('pdf') || url.includes('doc')) return <Book className="h-4 w-4 text-emerald-500" />;
    if (url.includes('info') || url.includes('about') || url.includes('faq')) return <Info className="h-4 w-4 text-amber-500" />;
    return <LinkIcon className="h-4 w-4 text-purple-500" />;
  }, []);

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

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div>
          <CardTitle>Resources</CardTitle>
          <CardDescription>Add and manage helpful resources for your clients.</CardDescription>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-1" onClick={handleOpenAddDialog}>
              <Plus className="h-4 w-4" />
              Add Resource
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Resource</DialogTitle>
              <DialogDescription>
                Add a helpful resource for your clients. This could be a video, article, or tool that they might find useful.
              </DialogDescription>
            </DialogHeader>
            <ResourceForm 
              form={form} 
              onSubmit={onSubmit} 
              isSubmitting={isAddingResource}
              isEditing={false}
            />
          </DialogContent>
        </Dialog>
      </CardHeader>
      
      <CardContent>
        {resources && resources.length > 0 ? (
          <div className="space-y-4">
            {resources.map((resource) => (
              <div key={resource.id} className="border rounded-md p-4 shadow-sm">
                <div className="flex justify-between items-start">
                  <div className="flex items-start gap-3 flex-1">
                    <div className="mt-0.5 p-1.5 bg-muted rounded-md">
                      {getIconForResource(resource.url)}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-medium">{resource.title}</h3>
                      {resource.description && (
                        <p className="text-sm text-muted-foreground mt-1">{resource.description}</p>
                      )}
                      {resource.url && (
                        <a 
                          href={resource.url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline text-sm flex items-center gap-1 mt-1"
                        >
                          {resource.url}
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      )}
                      
                      {resource.tags && resource.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {resource.tags.map(tag => (
                            <div key={tag} className="flex items-center bg-muted text-xs px-2 py-1 rounded-full">
                              <Tag className="h-3 w-3 mr-1 text-muted-foreground" />
                              {tag}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Dialog open={isEditDialogOpen && editingResource?.id === resource.id} onOpenChange={(open) => {
                      if (open) {
                        handleOpenEditDialog(resource);
                      } else {
                        handleCloseEditDialog();
                      }
                    }}>
                      <DialogTrigger asChild>
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={() => handleOpenEditDialog(resource)}
                        >
                          <Pencil className="h-4 w-4" />
                          <span className="sr-only">Edit</span>
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Edit Resource</DialogTitle>
                          <DialogDescription>
                            Update the details of this resource.
                          </DialogDescription>
                        </DialogHeader>
                        <ResourceForm 
                          form={form} 
                          onSubmit={onSubmit} 
                          isSubmitting={isUpdatingResource}
                          isEditing={true}
                        />
                      </DialogContent>
                    </Dialog>
                    
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <Trash2 className="h-4 w-4 text-red-500" />
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
                            onClick={() => deleteResource(resource.id)}
                            className="bg-red-500 hover:bg-red-600"
                          >
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 border border-dashed rounded-lg">
            <div className="mx-auto bg-muted w-12 h-12 flex items-center justify-center rounded-full mb-3">
              <Book className="h-6 w-6 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-medium mb-1">No resources yet</h3>
            <p className="text-muted-foreground mb-4">
              Add helpful resources for your clients to access.
            </p>
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={handleOpenAddDialog}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Your First Resource
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add New Resource</DialogTitle>
                  <DialogDescription>
                    Add a helpful resource for your clients. This could be a video, article, or tool that they might find useful.
                  </DialogDescription>
                </DialogHeader>
                <ResourceForm 
                  form={form} 
                  onSubmit={onSubmit} 
                  isSubmitting={isAddingResource}
                  isEditing={false}
                />
              </DialogContent>
            </Dialog>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ResourcesManagement;
