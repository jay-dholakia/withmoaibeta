
import React from 'react';
import { AdminDashboardLayout } from '@/layouts/AdminDashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Mail, Users, UserPlus, UserSquare, Eye } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Link } from 'react-router-dom';
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ClientPreview } from '@/components/admin/ClientPreview';

const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { userType } = useAuth();
  const [isPreviewDialogOpen, setIsPreviewDialogOpen] = React.useState(false);
  
  React.useEffect(() => {
    if (userType !== 'admin') {
      navigate('/admin');
    }
  }, [userType, navigate]);

  if (userType !== 'admin') {
    return null;
  }

  const assignAlternativeExercises = async () => {
    try {
      toast.info("Started assigning alternative exercises...", {
        duration: 3000,
      });

      const { data, error } = await supabase.functions.invoke(
        'assign-alternative-exercises',
        {
          body: { maxPerExercise: 3 }
        }
      );

      if (error) {
        throw new Error(error.message);
      }

      toast.success(`Successfully processed ${data.processed} exercises with ${data.updated} alternatives assigned.`);
    } catch (error) {
      console.error("Error assigning alternative exercises:", error);
      toast.error("Failed to assign alternative exercises. Please try again.");
    }
  };

  return (
    <AdminDashboardLayout title="Admin Dashboard">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-l-4 border-l-admin w-full">
          <CardHeader className="pb-2">
            <CardTitle className="text-xl">Invitations</CardTitle>
            <CardDescription>
              Manage pending invitations
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              className="w-full" 
              onClick={() => navigate('/admin-dashboard/invitations')}
            >
              <Mail className="w-4 h-4 mr-2" />
              View Invitations
            </Button>
          </CardContent>
        </Card>
        
        <Card className="border-l-4 border-l-violet-500 w-full">
          <CardHeader className="pb-2">
            <CardTitle className="text-xl">Groups</CardTitle>
            <CardDescription>
              Manage client groups and coaches
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              className="w-full" 
              onClick={() => navigate('/admin-dashboard/groups')}
            >
              <UserSquare className="w-4 h-4 mr-2" />
              Manage Groups
            </Button>
          </CardContent>
        </Card>
        
        <Card className="border-l-4 border-l-client w-full">
          <CardHeader className="pb-2">
            <CardTitle className="text-xl">Clients</CardTitle>
            <CardDescription>
              Manage registered clients
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              className="w-full" 
              onClick={() => navigate('/admin-dashboard/clients')}
            >
              <Users className="w-4 h-4 mr-2" />
              View Clients
            </Button>
          </CardContent>
        </Card>
        
        <Card className="border-l-4 border-l-coach w-full">
          <CardHeader className="pb-2">
            <CardTitle className="text-xl">Coaches</CardTitle>
            <CardDescription>
              Manage registered coaches
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              className="w-full" 
              onClick={() => navigate('/admin-dashboard/coaches')}
            >
              <UserPlus className="w-4 h-4 mr-2" />
              View Coaches
            </Button>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Exercise Management</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Button asChild className="w-full">
                <Link to="/admin-dashboard/exercise-management">
                  Manage Exercise Videos & Alternatives
                </Link>
              </Button>
              <Button asChild className="w-full">
                <Link to="/exercise-import">
                  Import Exercises
                </Link>
              </Button>
              <Button 
                onClick={assignAlternativeExercises}
                className="w-full"
              >
                Auto-Assign Alternative Exercises
              </Button>
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-l-4 border-l-blue-500 w-full">
          <CardHeader className="pb-2">
            <CardTitle className="text-xl">Client Preview</CardTitle>
            <CardDescription>
              Preview client dashboard as an admin
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Dialog open={isPreviewDialogOpen} onOpenChange={setIsPreviewDialogOpen}>
              <DialogTrigger asChild>
                <Button className="w-full">
                  <Eye className="w-4 h-4 mr-2" />
                  Preview Client View
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Client View Preview</DialogTitle>
                </DialogHeader>
                
                <Tabs defaultValue="client-view" className="w-full mt-4">
                  <TabsList className="w-full">
                    <TabsTrigger value="client-view" className="flex-1">Preview Client View</TabsTrigger>
                  </TabsList>
                  <TabsContent value="client-view" className="pt-4">
                    <ClientPreview />
                  </TabsContent>
                </Tabs>
              </DialogContent>
            </Dialog>
          </CardContent>
        </Card>
      </div>
    </AdminDashboardLayout>
  );
};

export default AdminDashboard;
