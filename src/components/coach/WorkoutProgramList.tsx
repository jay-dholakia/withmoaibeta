import React, { useState, useEffect } from 'react';
import { WorkoutProgram } from '@/types/workout';
import { Button } from '@/components/ui/button';
import { PlusCircle, Calendar, Users, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { getWorkoutProgramAssignmentCount } from '@/services/workout-service';

interface WorkoutProgramListProps {
  programs: WorkoutProgram[];
  isLoading: boolean;
  onDeleteProgram?: (programId: string) => void;
}

export const WorkoutProgramList: React.FC<WorkoutProgramListProps> = ({ 
  programs, 
  isLoading, 
  onDeleteProgram 
}) => {
  const navigate = useNavigate();
  const [assignmentCounts, setAssignmentCounts] = useState<Record<string, number>>({});

  useEffect(() => {
    const fetchAssignmentCounts = async () => {
      if (programs.length === 0) return;
      
      try {
        const programIds = programs.map(program => program.id);
        const counts = await getWorkoutProgramAssignmentCount(programIds);
        setAssignmentCounts(counts || {});
      } catch (error) {
        console.error('Error fetching assignment counts:', error);
        setAssignmentCounts({});
      }
    };

    if (programs.length > 0) {
      fetchAssignmentCounts();
    }
  }, [programs]);

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="border rounded-lg p-6 animate-pulse">
            <div className="h-6 bg-muted/60 rounded w-1/3 mb-3"></div>
            <div className="h-4 bg-muted/60 rounded w-2/3 mb-6"></div>
            <div className="flex gap-4">
              <div className="h-8 bg-muted/60 rounded w-24"></div>
              <div className="h-8 bg-muted/60 rounded w-24"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (programs.length === 0) {
    return (
      <div className="text-center p-10 border rounded-lg bg-muted/10">
        <h3 className="font-medium text-lg mb-2">No workout programs yet</h3>
        <p className="text-muted-foreground mb-6">Create your first workout program to get started</p>
        <Button 
          onClick={() => navigate('/coach-dashboard/workouts/create')}
          className="gap-2"
        >
          <PlusCircle className="h-4 w-4" />
          Create Workout Program
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {programs.map((program) => (
        <div key={program.id} className="border rounded-lg p-6 hover:shadow-md transition-shadow">
          <h3 className="font-medium text-lg text-left">{program.title}</h3>
          <div className="flex flex-wrap gap-2 mb-4">
            <span className="bg-muted px-2 py-1 rounded-full text-xs flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              {program.weeks} {program.weeks === 1 ? 'week' : 'weeks'}
            </span>
            <span className="bg-muted px-2 py-1 rounded-full text-xs flex items-center gap-1">
              <Users className="h-3 w-3" />
              {assignmentCounts[program.id] || 0} {assignmentCounts[program.id] === 1 ? 'client' : 'clients'} assigned
            </span>
            <span className="bg-muted px-2 py-1 rounded-full text-xs">
              Created: {new Date(program.created_at).toLocaleDateString()}
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => navigate(`/coach-dashboard/workouts/${program.id}`)}
            >
              View Details
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => navigate(`/coach-dashboard/workouts/${program.id}/assign`)}
            >
              <Users className="h-4 w-4 mr-1" />
              Assign to Clients
            </Button>
            {onDeleteProgram && (
              <Button 
                variant="outline" 
                size="sm"
                className="text-destructive hover:bg-destructive/10 hover:text-destructive border-destructive/40"
                onClick={(e) => {
                  e.stopPropagation();
                  onDeleteProgram(program.id);
                }}
              >
                <Trash2 className="h-4 w-4 mr-1" />
                Delete
              </Button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};
