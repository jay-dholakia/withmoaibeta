
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { WorkoutProgram } from '@/types/workout';
import { Dumbbell, MoreVertical, Trash } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface WorkoutProgramListProps {
  programs: WorkoutProgram[];
  isLoading: boolean;
  onDeleteProgram: (id: string) => void;
}

export const WorkoutProgramList: React.FC<WorkoutProgramListProps> = ({
  programs,
  isLoading,
  onDeleteProgram,
}) => {
  const navigate = useNavigate();

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="bg-muted/20 h-36 animate-pulse"></Card>
        ))}
      </div>
    );
  }

  if (programs.length === 0) {
    return (
      <Card className="border-dashed border-2 p-8">
        <CardContent className="flex flex-col items-center justify-center text-center p-8">
          <h3 className="font-medium text-lg mb-2">No Workout Programs</h3>
          <p className="text-muted-foreground mb-4">
            You haven't created any workout programs yet. Create your first program to get started.
          </p>
          <Button onClick={() => navigate('/coach-dashboard/workouts/create')} className="gap-2">
            <PlusCircle className="h-4 w-4" />
            Create Program
          </Button>
        </CardContent>
      </Card>
    );
  }

  const getTypeIcon = (type?: string) => {
    switch(type) {
      case 'strength': 
        return <Dumbbell className="h-5 w-5 text-coach" />;
      case 'run': 
        return <span className="text-lg" role="img" aria-label="Running">🏃</span>;
      default:
        return <Dumbbell className="h-5 w-5 text-coach" />;
    }
  };

  return (
    <div className="space-y-4">
      {programs.map((program) => (
        <Card key={program.id} className="hover:shadow-sm transition-shadow">
          <CardHeader className="pb-2 flex flex-row items-start justify-between">
            <div>
              <div className="flex items-center gap-2">
                {getTypeIcon((program as any).program_type)}
                <CardTitle className="text-xl hover:text-coach cursor-pointer" onClick={() => navigate(`/coach-dashboard/workouts/${program.id}`)}>
                  {program.title}
                </CardTitle>
              </div>
              <CardDescription>
                Created {formatDistanceToNow(new Date(program.created_at), { addSuffix: true })}
              </CardDescription>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onDeleteProgram(program.id)} className="text-destructive">
                  <Trash className="h-4 w-4 mr-2" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-muted-foreground">
              {program.description ? (
                <p>{program.description}</p>
              ) : (
                <p>No description provided.</p>
              )}
              <div className="flex items-center gap-2 mt-2">
                <div className="bg-muted px-2 py-1 rounded-md text-xs">
                  {program.weeks} {program.weeks === 1 ? 'week' : 'weeks'}
                </div>
                {(program as any).program_type && (
                  <div className="bg-muted px-2 py-1 rounded-md text-xs capitalize">
                    {(program as any).program_type === 'run' ? 'Moai Run' : 'Moai Strength'}
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
