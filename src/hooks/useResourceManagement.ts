
import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import {
  fetchCoachResources,
  addCoachResource,
  updateCoachResource,
  deleteCoachResource,
  CoachResource
} from '@/services/coach-resource-service';

export type ResourceFormValues = {
  title: string;
  description?: string | null;
  url?: string | null;
  tags?: string[] | null;
  resource_type: 'article' | 'product' | 'tip';
};

export const useResourceManagement = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [editingResource, setEditingResource] = useState<CoachResource | null>(null);
  
  const {
    data: resources,
    isLoading,
    error
  } = useQuery({
    queryKey: ['coach-resources', user?.id],
    queryFn: () => {
      if (!user?.id) throw new Error('Not authenticated');
      return fetchCoachResources(user.id);
    },
    enabled: !!user?.id
  });
  
  const addResourceMutation = useMutation({
    mutationFn: async (values: ResourceFormValues) => {
      if (!user?.id) throw new Error('Not authenticated');
      // Ensure we're not changing the original values object
      const processedValues = {
        coach_id: user.id,
        title: values.title,
        description: values.description || null,
        url: values.url || null,
        tags: values.tags || [],
        resource_type: values.resource_type
      };
      return addCoachResource(processedValues);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['coach-resources', user?.id] });
      toast.success('Resource added successfully');
    },
    onError: (error) => {
      toast.error('Failed to add resource: ' + (error as Error).message);
    }
  });
  
  const updateResourceMutation = useMutation({
    mutationFn: async ({ id, values }: { id: string; values: ResourceFormValues }) => {
      if (!user?.id) throw new Error('Not authenticated');
      // Ensure we're not changing the original values object
      const processedValues = {
        title: values.title,
        description: values.description || null,
        url: values.url || null,
        tags: values.tags || [],
        resource_type: values.resource_type
      };
      return updateCoachResource(id, user.id, processedValues);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['coach-resources', user?.id] });
      toast.success('Resource updated successfully');
      setEditingResource(null);
    },
    onError: (error) => {
      toast.error('Failed to update resource: ' + (error as Error).message);
    }
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
    }
  });
  
  const handleEdit = useCallback((resource: CoachResource) => {
    setEditingResource(resource);
  }, []);
  
  const handleCancelEdit = useCallback(() => {
    setEditingResource(null);
  }, []);
  
  return {
    resources,
    isLoading,
    error,
    editingResource,
    handleEdit,
    handleCancelEdit,
    addResource: addResourceMutation.mutate,
    updateResource: updateResourceMutation.mutate,
    deleteResource: deleteResourceMutation.mutate,
    isAddingResource: addResourceMutation.isPending,
    isUpdatingResource: updateResourceMutation.isPending,
    isDeletingResource: deleteResourceMutation.isPending
  };
};
