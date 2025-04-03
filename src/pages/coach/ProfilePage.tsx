
import React from 'react';
import { CoachLayout } from '@/layouts/CoachLayout';
import ResourcesManagement from '@/components/coach/ResourcesManagement';

const ProfilePage = () => {
  return (
    <CoachLayout>
      <h1 className="text-3xl font-bold text-coach mb-8">Coach Profile</h1>
      
      <div className="space-y-8">
        <div className="text-center py-12 bg-muted/30 rounded-lg mb-8">
          <p className="text-lg font-medium mb-2">Coach Profile Editor Coming Soon!</p>
          <p className="text-muted-foreground">
            This area will allow you to update your profile information, bio, certifications, 
            and more. Stay tuned for this feature.
          </p>
        </div>
        
        <ResourcesManagement />
      </div>
    </CoachLayout>
  );
};

export default ProfilePage;
