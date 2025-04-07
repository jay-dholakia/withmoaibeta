
import React from 'react';
import { TestWeeklyProgressButton } from '@/components/test/TestWeeklyProgressButton';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

export const WeeklyProgressTestPanel = () => {
  return (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle className="text-md">Edge Function Test Panel</CardTitle>
        <CardDescription>
          Test the get_weekly_progress Edge Function deployment
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-col gap-2">
          <p className="text-sm text-muted-foreground">
            Click the button below to test if the get_weekly_progress Edge Function is properly 
            deployed and callable. Results will display in the console.
          </p>
          <TestWeeklyProgressButton />
        </div>
      </CardContent>
    </Card>
  );
};
