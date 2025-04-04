
import React, { useEffect } from 'react';
import { AdminDashboardLayout } from '@/layouts/AdminDashboardLayout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import GroupList from '@/components/admin/GroupList';
import GroupForm from '@/components/admin/GroupForm';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const GroupsPage: React.FC = () => {
  const { userType, user } = useAuth();
  const navigate = useNavigate();
  
  // Check if we need to create a default Moai group for testing
  useEffect(() => {
    const checkAndCreateMoaiGroup = async () => {
      try {
        // Check if any Moai group exists
        const { data: existingGroups, error: checkError } = await supabase
          .from('groups')
          .select('id, name')
          .eq('program_type', 'run');
          
        if (checkError) {
          console.error('Error checking for run groups:', checkError);
          return;
        }
        
        // If no run group exists, create one
        if (!existingGroups || existingGroups.length === 0) {
          console.log('No run group found, creating one...');
          
          if (!user?.id) {
            console.error('User ID is required to create a group');
            return;
          }
          
          const { data: newGroup, error: createError } = await supabase
            .from('groups')
            .insert({
              name: 'Moai - 1',
              description: 'Default Moai group for testing',
              created_by: user.id,
              program_type: 'run'
            })
            .select();
            
          if (createError) {
            console.error('Error creating Moai group:', createError);
          } else {
            console.log('Successfully created Moai group:', newGroup);
            toast.success('Created default Moai group for testing');
          }
        } else {
          console.log('Existing run groups:', existingGroups);
        }
      } catch (error) {
        console.error('Unexpected error in checkAndCreateMoaiGroup:', error);
      }
    };
    
    // Only run this for admin users
    if (userType === 'admin') {
      checkAndCreateMoaiGroup();
    }
  }, [userType, user]);
  
  // Redirect if not admin
  useEffect(() => {
    if (userType !== 'admin') {
      navigate('/admin');
    }
  }, [userType, navigate]);

  if (userType !== 'admin') {
    return null;
  }

  return (
    <AdminDashboardLayout title="Groups Management">
      <div className="w-full">
        <Tabs defaultValue="list" className="w-full">
          <TabsList className="mb-4">
            <TabsTrigger value="list">All Groups</TabsTrigger>
            <TabsTrigger value="create">Create Group</TabsTrigger>
          </TabsList>
          
          <TabsContent value="list">
            <GroupList />
          </TabsContent>
          
          <TabsContent value="create">
            <GroupForm />
          </TabsContent>
        </Tabs>
      </div>
    </AdminDashboardLayout>
  );
};

export default GroupsPage;
