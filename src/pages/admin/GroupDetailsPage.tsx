import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AdminDashboardLayout } from '@/layouts/AdminDashboardLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { ArrowLeft, Save, Users, UserPlus } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { updateGroup } from '@/services/group-service';
import { Label as LabelComponent } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface Group {
  id: string;
  name: string;
  description: string | null;
  spotify_playlist_url: string | null;
  created_at: string;
  created_by: string;
  program_type: string;
}

const GroupDetailsPage = () => {
  const { groupId } = useParams<{ groupId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [group, setGroup] = useState<Group | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  
  const [formValues, setFormValues] = useState({
    name: '',
    description: '',
    spotify_playlist_url: '',
    program_type: 'strength'
  });
  
  // Fetch group details
  const { data, isLoading, error } = useQuery({
    queryKey: ['group-details', groupId],
    queryFn: async () => {
      if (!groupId) return null;
      
      const { data, error } = await supabase
        .from('groups')
        .select('*')
        .eq('id', groupId)
        .single();
        
      if (error) throw error;
      return data as Group;
    },
    enabled: !!groupId,
  });
  
  // Update the state when data is loaded
  useEffect(() => {
    if (data) {
      setGroup(data);
      setFormValues({
        name: data.name || '',
        description: data.description || '',
        spotify_playlist_url: data.spotify_playlist_url || '',
        program_type: data.program_type || 'strength'
      });
    }
  }, [data]);

  // Handle form changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormValues(prev => ({ ...prev, [name]: value }));
  };
  
  const handleProgramTypeChange = (value: string) => {
    setFormValues(prev => ({ ...prev, program_type: value }));
  };
  
  // Mutation for updating the group
  const updateMutation = useMutation({
    mutationFn: async (values: typeof formValues) => {
      if (!groupId) throw new Error('Group ID is required');
      
      return await updateGroup(groupId, {
        name: values.name,
        description: values.description,
        spotify_playlist_url: values.spotify_playlist_url || null,
        program_type: values.program_type
      });
    },
    onSuccess: (data) => {
      if (data.success) {
        toast.success('Group updated successfully');
        queryClient.invalidateQueries({ queryKey: ['group-details', groupId] });
        setIsEditing(false);
      } else {
        toast.error(data.message || 'Failed to update group');
      }
    },
    onError: (error) => {
      console.error('Error updating group:', error);
      toast.error('An error occurred while updating the group');
    }
  });
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateMutation.mutate(formValues);
  };
  
  if (isLoading) {
    return (
      <AdminDashboardLayout title="Group Details">
        <div className="flex justify-center p-8">Loading group details...</div>
      </AdminDashboardLayout>
    );
  }
  
  if (error || !group) {
    return (
      <AdminDashboardLayout title="Group Details">
        <div className="bg-red-50 p-4 rounded-md text-red-700 mb-4">
          Failed to load group details. Please try again.
        </div>
        <Button onClick={() => navigate('/admin-dashboard/groups')} variant="outline">
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to Groups
        </Button>
      </AdminDashboardLayout>
    );
  }
  
  return (
    <AdminDashboardLayout title={`Group: ${group.name}`}>
      <div className="mb-6">
        <Button onClick={() => navigate('/admin-dashboard/groups')} variant="outline">
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to Groups
        </Button>
      </div>
      
      <Card className="mb-6">
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Group Information</CardTitle>
            <Button 
              onClick={() => setIsEditing(!isEditing)} 
              variant={isEditing ? "outline" : "default"}
            >
              {isEditing ? 'Cancel' : 'Edit Group'}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {isEditing ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="name">Group Name</Label>
                <Input 
                  id="name" 
                  name="name" 
                  value={formValues.name} 
                  onChange={handleChange} 
                  required 
                />
              </div>
              
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea 
                  id="description" 
                  name="description" 
                  value={formValues.description || ''} 
                  onChange={handleChange} 
                  rows={3}
                />
              </div>
              
              <div className="mb-4">
                <LabelComponent>Program Type</LabelComponent>
                <Select
                  value={formValues.program_type || 'strength'}
                  onValueChange={handleProgramTypeChange}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select program type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="strength">Moai Strength</SelectItem>
                    <SelectItem value="run">Moai Run</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="spotify_playlist_url">Spotify Playlist URL (Optional)</Label>
                <Input 
                  id="spotify_playlist_url" 
                  name="spotify_playlist_url" 
                  value={formValues.spotify_playlist_url || ''} 
                  onChange={handleChange} 
                  placeholder="https://open.spotify.com/playlist/..." 
                />
              </div>
              
              <Button type="submit" disabled={updateMutation.isPending}>
                <Save className="w-4 h-4 mr-2" /> Save Changes
              </Button>
            </form>
          ) : (
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-medium text-gray-500">Group Name</h3>
                <p>{group.name}</p>
              </div>
              
              <div>
                <h3 className="text-sm font-medium text-gray-500">Description</h3>
                <p>{group.description || 'No description'}</p>
              </div>
              
              <div>
                <h3 className="text-sm font-medium text-gray-500">Program Type</h3>
                <p>{group.program_type === 'run' ? 'Moai Run' : 'Moai Strength'}</p>
              </div>
              
              <div>
                <h3 className="text-sm font-medium text-gray-500">Spotify Playlist</h3>
                {group.spotify_playlist_url ? (
                  <a 
                    href={group.spotify_playlist_url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline"
                  >
                    Open Playlist
                  </a>
                ) : (
                  <p>No playlist set</p>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Group Members</CardTitle>
          </CardHeader>
          <CardContent>
            <Button onClick={() => navigate(`/admin-dashboard/groups/${groupId}/members`)}>
              <Users className="w-4 h-4 mr-2" /> Manage Members
            </Button>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Group Coaches</CardTitle>
          </CardHeader>
          <CardContent>
            <Button onClick={() => navigate(`/admin-dashboard/groups/${groupId}/coaches`)}>
              <UserPlus className="w-4 h-4 mr-2" /> Manage Coaches
            </Button>
          </CardContent>
        </Card>
      </div>
    </AdminDashboardLayout>
  );
};

export default GroupDetailsPage;
