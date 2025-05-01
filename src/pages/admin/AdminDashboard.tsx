
import React from 'react';
import { AdminDashboardLayout } from '@/layouts/AdminDashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Mail, Users, UserPlus, UserSquare, BarChart3, Dumbbell } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Link } from 'react-router-dom';
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { BackfillFireBadgesButton } from '@/components/admin/BackfillFireBadgesButton';

const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { userType } = useAuth();
  
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
              <UserSquare className="w-5 h-5 mr-2" />
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
              <Users className="w-5 h-5 mr-2" />
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
              <UserPlus className="w-5 h-5 mr-2" />
              View Coaches
            </Button>
          </CardContent>
        </Card>
        
        <Card className="border-l-4 border-l-green-500 w-full">
          <CardHeader className="pb-2">
            <CardTitle className="text-xl">Client Stats</CardTitle>
            <CardDescription>
              View client workout statistics
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              className="w-full" 
              onClick={() => navigate('/admin-dashboard/client-stats')}
            >
              <BarChart3 className="w-5 h-5 mr-2" />
              View Statistics
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
              <BackfillFireBadgesButton 
                variant="default" 
                size="default" 
                className="w-full" 
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminDashboardLayout>
  );
};

export default AdminDashboard;
