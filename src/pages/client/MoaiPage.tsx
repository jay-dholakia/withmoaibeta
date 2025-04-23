
import React from 'react';
import { useParams } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import MoaiCoachTab from '@/components/client/MoaiCoachTab';
import MoaiMembersTab from '@/components/client/MoaiMembersTab';
import MoaiGroupProgress from '@/components/client/MoaiGroupProgress';
import DashboardJournalSection from '@/components/client/DashboardJournalSection';

const MoaiPage = () => {
  const { groupId } = useParams();

  return (
    <div className="space-y-6">
      <MoaiGroupProgress />
      
      <div className="grid gap-6 md:grid-cols-2">
        <DashboardJournalSection />
        
        <Tabs defaultValue="coach" className="w-full">
          <TabsList>
            <TabsTrigger value="coach">Your Coach</TabsTrigger>
            <TabsTrigger value="members">Members</TabsTrigger>
          </TabsList>
          <TabsContent value="coach">
            <MoaiCoachTab groupId={groupId} />
          </TabsContent>
          <TabsContent value="members">
            <MoaiMembersTab groupId={groupId} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default MoaiPage;
