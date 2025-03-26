
import React, { useState } from 'react';
import { WeekProgressSection } from '@/components/client/WeekProgressSection';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Users, User, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { getWorkoutsForUserEmail } from '@/services/leaderboard-service';
import { toast } from 'sonner';

const LeaderboardPage = () => {
  const [email, setEmail] = useState('');
  const [weekNumber, setWeekNumber] = useState(1);
  const [searchResults, setSearchResults] = useState<null | {
    email: string;
    weekNumber: number;
    workoutsCount: number;
    error?: string;
  }>(null);

  const handleSearch = async () => {
    if (!email) {
      toast.error('Please enter an email address');
      return;
    }
    
    try {
      const result = await getWorkoutsForUserEmail(email, weekNumber);
      setSearchResults(result);
      
      if (result.error) {
        toast.error(`Error: ${result.error}`);
      } else {
        toast.success(`Found ${result.workoutsCount} workouts for ${result.email} in week ${result.weekNumber}`);
      }
    } catch (error) {
      console.error('Error searching for workouts:', error);
      toast.error('Failed to search for workouts');
    }
  };

  return (
    <div className="container max-w-4xl mx-auto px-4">
      <h1 className="text-2xl font-bold mb-6">Team Progress</h1>
      
      <div className="mb-6 p-4 border rounded-lg bg-muted/30">
        <h2 className="text-lg font-medium mb-3 flex items-center gap-2">
          <Search className="h-4 w-4" />
          Workout Assignment Lookup
        </h2>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Input 
            placeholder="Email address" 
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="flex-grow"
          />
          <Input
            type="number"
            placeholder="Week number"
            value={weekNumber}
            onChange={(e) => setWeekNumber(parseInt(e.target.value) || 1)}
            min={1}
            max={52}
            className="w-24"
          />
          <Button onClick={handleSearch}>Search</Button>
        </div>
        
        {searchResults && (
          <div className="mt-3 p-3 bg-background rounded border">
            <p className="font-medium">Results:</p>
            {searchResults.error ? (
              <p className="text-destructive">{searchResults.error}</p>
            ) : (
              <p>
                <span className="font-medium">{searchResults.email}</span> has{' '}
                <span className="font-medium">{searchResults.workoutsCount}</span> workouts assigned 
                for week <span className="font-medium">{searchResults.weekNumber}</span>
              </p>
            )}
          </div>
        )}
      </div>
      
      <Tabs defaultValue="team" className="mb-6">
        <TabsList className="w-full mb-4">
          <TabsTrigger value="team" className="flex-1 flex items-center justify-center gap-2">
            <Users className="h-4 w-4" />
            <span>Team</span>
          </TabsTrigger>
          <TabsTrigger value="personal" className="flex-1 flex items-center justify-center gap-2">
            <User className="h-4 w-4" />
            <span>Personal</span>
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="team">
          <WeekProgressSection showTeam={true} showPersonal={false} />
        </TabsContent>
        
        <TabsContent value="personal">
          <WeekProgressSection showTeam={false} showPersonal={true} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default LeaderboardPage;
