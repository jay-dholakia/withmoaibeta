
import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useProgramType } from '@/hooks/useProgramType';
import { RunGoalsForm } from './RunGoalsForm';

interface ClientDetailViewTabsProps {
  clientId: string;
  clientEmail: string;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  children: React.ReactNode;
}

export const ClientDetailViewTabs: React.FC<ClientDetailViewTabsProps> = ({
  clientId,
  clientEmail,
  activeTab,
  setActiveTab,
  children
}) => {
  const { programType } = useProgramType();
  
  return (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
      <TabsList className="grid grid-cols-3 mb-4">
        <TabsTrigger value="history">Workout History</TabsTrigger>
        <TabsTrigger value="programs">Programs</TabsTrigger>
        {programType === 'run' && (
          <TabsTrigger value="goals">Run Goals</TabsTrigger>
        )}
      </TabsList>
      
      <TabsContent value="history" className="mt-0">
        {activeTab === 'history' && children}
      </TabsContent>
      
      <TabsContent value="programs" className="mt-0">
        {activeTab === 'programs' && children}
      </TabsContent>
      
      {programType === 'run' && (
        <TabsContent value="goals" className="mt-0">
          <RunGoalsForm 
            userId={clientId} 
            clientEmail={clientEmail} 
          />
        </TabsContent>
      )}
    </Tabs>
  );
};
