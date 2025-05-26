
import { BookText } from 'lucide-react';

interface WorkoutJournalProps {
  notes?: string | null;
}

export const WorkoutJournal: React.FC<WorkoutJournalProps> = ({ notes }) => {
  return (
    <div className="mt-6 space-y-2">
      <div className="flex items-center gap-2">
        <BookText className="h-4 w-4" />
        <h4 className="text-sm font-medium">Workout Journal</h4>
      </div>
      
      {notes ? (
        <div className="p-3 bg-muted/40 rounded-md border border-border">
          <p className="whitespace-pre-wrap text-sm">{notes}</p>
        </div>
      ) : (
        <div className="p-3 bg-muted/40 rounded-md border border-border text-muted-foreground text-sm italic">
          No journal entries for this workout
        </div>
      )}
    </div>
  );
};
