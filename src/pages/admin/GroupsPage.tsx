
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
  const { userType } = useAuth();
  const navigate = useNavigate();
  
  // Check if we need to create a default Moai group for testing
  useEffect(() => {
    const checkAndCreateMoaiGroup = async () => {
      try {
        // Check if any Moai group exists
        const { data: existingGroups, error: checkError } = await supabase
          .from('groups')
          .select('id, name')
          .ilike('name', 'Moai%');
          
        if (checkError) {
          console.error('Error checking for Moai groups:', checkError);
          return;
        }
        
        // If no Moai group exists, create one
        if (!existingGroups || existingGroups.length === 0) {
          console.log('No Moai group found, creating one...');
          
          const { data: newGroup, error: createError } = await supabase
            .from('groups')
            .insert([{
              name: 'Moai - 1',
              description: 'Default Moai group for testing'
            }])
            .select();
            
          if (createError) {
            console.error('Error creating Moai group:', createError);
          } else {
            console.log('Successfully created Moai group:', newGroup);
            toast.success('Created default Moai group for testing');
          }
        } else {
          console.log('Existing Moai groups:', existingGroups);
        }
      } catch (error) {
        console.error('Unexpected error in checkAndCreateMoaiGroup:', error);
      }
    };
    
    // Only run this for admin users
    if (userType === 'admin') {
      checkAndCreateMoaiGroup();
    }
  }, [userType]);
  
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
    </AdminDashboardLayout>
  );
};

export default GroupsPage;
