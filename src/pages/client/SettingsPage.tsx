
import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { fetchClientProfile } from '@/services/client-service';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Loader2, User, LogOut, Edit, FileText, Shield, MoonStar } from 'lucide-react';
import BetaFeedbackCard from '@/components/client/BetaFeedbackCard';
import { ThemeToggle } from '@/components/ThemeToggle';

const SettingsPage = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  
  const { data: profile, isLoading: profileLoading } = useQuery({
    queryKey: ['client-profile-settings', user?.id],
    queryFn: () => fetchClientProfile(user?.id || ''),
    enabled: !!user?.id,
  });

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate('/client');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const handleEditProfile = () => {
    navigate('/client-dashboard/settings/edit-profile', { state: { from: 'settings' } });
  };

  const formatDate = (dateValue: string | Date | null) => {
    if (!dateValue) return 'Not provided';
    
    // Convert to Date object if it's a string
    const date = typeof dateValue === 'string' ? new Date(dateValue) : dateValue;
    
    const year = date.getUTCFullYear();
    const month = date.getUTCMonth() + 1;
    const day = date.getUTCDate();
    
    return `${month}/${day}/${year}`;
  };

  if (profileLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-client" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Profile</CardTitle>
          <CardDescription>Your personal information</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col items-center sm:flex-row sm:items-start gap-4">
            <Avatar className="w-24 h-24 border-2 border-client">
              {profile?.avatar_url ? (
                <AvatarImage src={profile.avatar_url} alt="Profile" />
              ) : (
                <AvatarFallback className="bg-muted">
                  <User className="h-12 w-12 text-muted-foreground" />
                </AvatarFallback>
              )}
            </Avatar>
            
            <div className="space-y-1 text-center sm:text-left">
              <h3 className="text-xl font-medium">
                {profile?.first_name} {profile?.last_name}
              </h3>
              <p className="text-muted-foreground">{user?.email}</p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Location</p>
              <p>{profile?.city || 'Not provided'}, {profile?.state || 'Not provided'}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Date of Birth</p>
              <p>{formatDate(profile?.birthday)}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Height</p>
              <p>{profile?.height || 'Not provided'}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Weight</p>
              <p>{profile?.weight || 'Not provided'}</p>
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex justify-end border-t pt-4">
          <Button
            variant="outline"
            onClick={handleEditProfile}
            className="flex items-center"
          >
            <Edit className="mr-2 h-4 w-4" />
            Edit Profile
          </Button>
        </CardFooter>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Appearance</CardTitle>
          <CardDescription>Customize how the app looks</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MoonStar className="h-5 w-5 text-muted-foreground" />
              <span>Dark Mode</span>
            </div>
            <ThemeToggle showLabel={false} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Legal</CardTitle>
          <CardDescription>Privacy Policy and Terms of Service</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col gap-3">
            <Link 
              to="/client-dashboard/settings/privacy-policy" 
              className="flex items-center text-blue-600 dark:text-blue-400 hover:underline"
            >
              <Shield className="mr-2 h-4 w-4" />
              Privacy Policy
            </Link>
            <Link 
              to="/client-dashboard/settings/terms-of-service" 
              className="flex items-center text-blue-600 dark:text-blue-400 hover:underline"
            >
              <FileText className="mr-2 h-4 w-4" />
              Terms of Service
            </Link>
          </div>
        </CardContent>
      </Card>
      
      <BetaFeedbackCard />
      
      <Card>
        <CardHeader>
          <CardTitle>Account</CardTitle>
          <CardDescription>Manage your account settings</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            If you need to change your email or password, please contact your coach or administrator.
          </p>
        </CardContent>
        <CardFooter className="border-t pt-4">
          <Button
            variant="destructive"
            onClick={handleSignOut}
            className="flex items-center"
          >
            <LogOut className="mr-2 h-4 w-4" />
            Sign Out
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default SettingsPage;
