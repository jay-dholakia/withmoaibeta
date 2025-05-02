
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { getWorkoutProgramAssignmentCount } from '@/services/program-service';

interface WorkoutProgramListProps {
  programs: any[];
  onDelete?: (id: string) => void;
  showActions?: boolean;
}

export const WorkoutProgramList = ({ programs, onDelete, showActions = true }: WorkoutProgramListProps) => {
  const [assignmentCounts, setAssignmentCounts] = useState<Record<string, number>>({});

  useEffect(() => {
    const loadAssignmentCounts = async () => {
      try {
        const programIds = programs.map(program => program.id);
        
        if (programIds.length > 0) {
          const counts = await getWorkoutProgramAssignmentCount(programIds);
          setAssignmentCounts(counts || {});
        }
      } catch (error) {
        console.error('Error loading program assignment counts:', error);
      }
    };

    loadAssignmentCounts();
  }, [programs]);

  if (!programs || programs.length === 0) {
    return <div className="text-center py-12 text-muted-foreground">No workout programs found.</div>;
  }

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {programs.map((program) => (
        <Card key={program.id} className="transition-all hover:shadow-md">
          <CardHeader className="pb-2">
            <div className="flex justify-between">
              <CardTitle className="text-lg">{program.title}</CardTitle>
              <Badge variant={program.program_type === 'run' ? 'destructive' : 'secondary'}>
                {program.program_type === 'run' ? 'Run' : 'Strength'}
              </Badge>
            </div>
            <CardDescription>{program.weeks} week program</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm line-clamp-2">
              {program.description || 'No description provided.'}
            </p>
            <div className="mt-4">
              <p className="text-sm text-muted-foreground">
                {assignmentCounts[program.id] || 0} clients assigned
              </p>
            </div>
          </CardContent>
          <CardFooter className="flex justify-between pt-2">
            <Button variant="outline" size="sm" asChild>
              <Link to={`/coach-dashboard/workouts/${program.id}`}>
                View Details
              </Link>
            </Button>
            {showActions && (
              <div className="flex gap-2">
                <Button variant="outline" size="sm" asChild>
                  <Link to={`/coach-dashboard/workouts/${program.id}/edit`}>
                    Edit
                  </Link>
                </Button>
                {onDelete && (
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="text-destructive hover:text-destructive"
                    onClick={() => onDelete(program.id)}
                  >
                    Delete
                  </Button>
                )}
              </div>
            )}
          </CardFooter>
        </Card>
      ))}
    </div>
  );
};
