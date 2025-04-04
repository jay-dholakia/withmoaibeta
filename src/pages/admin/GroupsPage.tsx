
import React, { useEffect } from 'react';
import { AdminDashboardLayout } from '@/layouts/AdminDashboardLayout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import GroupList from '@/components/admin/GroupList';
import GroupForm from '@/components/admin/GroupForm';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { createDefaultMoaiGroupIfNeeded } from '@/services/group-service';
import { toast } from 'sonner';
import { Dumbbell, Running } from 'lucide-react';

const GroupsPage: React.FC = () => {
  const { userType, user } = useAuth();
  const navigate = useNavigate();
  
  // Check if we need to create default Moai groups for testing
  useEffect(() => {
    const setupDefaultGroups = async () => {
      try {
        if (!user?.id) return;
        
        const result = await createDefaultMoaiGroupIfNeeded(user.id);
        
        if (result.success && result.message.includes('created')) {
          toast.success(result.message);
        }
      } catch (error) {
        console.error('Error setting up default groups:', error);
      }
    };
    
    // Only run this for admin users
    if (userType === 'admin') {
      setupDefaultGroups();
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
    <AdminDashboardLayout title="Groups Management - Moai Strength & Run">
      <div className="w-full">
        <div className="mb-4 flex gap-2 items-center">
          <Dumbbell className="h-5 w-5 text-amber-600" />
          <Running className="h-5 w-5 text-blue-600" />
          <span className="text-lg font-medium">Manage groups for both Moai Strength and Moai Run programs</span>
        </div>
        
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
