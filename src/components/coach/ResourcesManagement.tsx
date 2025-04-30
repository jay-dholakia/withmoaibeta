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

const RESOURCE_TAGS = [
  "Recovery", "Hydration", "Energy Gels", "Shoes", "Running Belts", "Energy Chews",
  "Electrolytes", "Nutrition", "Strength Training", "Mobility", "Stretching", "Race Day"
];

const resourceSchema = z.object({
  title: z.string().min(1, "Title is required").max(100, "Title is too long"),
  description: z.string().nullable().optional(),
  url: z.string().optional().nullable().or(z.literal('')),
  tags: z.array(z.string()).optional().nullable(),
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
    defaultValues: { title: '', description: '', url: '', tags: [] },
  });

  useEffect(() => {
    if (editingResource && isEditDialogOpen) {
      form.reset({
        title: editingResource.title,
        description: editingResource.description || '',
        url: editingResource.url || '',
        tags: editingResource.tags || [],
      });
    } else if (!isEditDialogOpen && !isAddDialogOpen) {
      form.reset({ title: '', description: '', url: '', tags: [] });
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
        url: values.url && values.url.trim() !== '' ? values.url : null,
        tags: values.tags || [],
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['coach-resources', user?.id] });
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
        url: values.url && values.url.trim() !== '' ? values.url : null,
        tags: values.tags || [],
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['coach-resources', user?.id] });
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
      queryClient.invalidateQueries({ queryKey: ['coach-resources', user?.id] });
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

  const getIconForResource = (url: string | null) => {
    if (!url) return <Info className="h-4 w-4 text-amber-500" />;
    if (url.includes('calendar') || url.includes('event') || url.includes('schedule')) return <Calendar className="h-4 w-4 text-blue-500" />;
    if (url.includes('book') || url.includes('pdf') || url.includes('doc')) return <Book className="h-4 w-4 text-emerald-500" />;
    if (url.includes('info') || url.includes('about') || url.includes('faq')) return <Info className="h-4 w-4 text-amber-500" />;
    return <LinkIcon className="h-4 w-4 text-purple-500" />;
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

  const resourceForm = (/* ... same form rendering as before ... */);

  return (/* ... same JSX rendering, using <div key={resource.id}> instead of React.Fragment ... */);
};

export default ResourcesManagement;
