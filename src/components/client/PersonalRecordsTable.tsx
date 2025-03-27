
import React from 'react';
import { Trophy } from 'lucide-react';
import { format } from 'date-fns';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';

export interface PersonalRecord {
  id: string;
  exercise_id: string;
  exercise_name: string;
  weight: number;
  reps: number;
  achieved_at: string;
}

interface PersonalRecordsTableProps {
  records: PersonalRecord[];
  isLoading: boolean;
}

export const PersonalRecordsTable = ({ records, isLoading }: PersonalRecordsTableProps) => {
  if (isLoading) {
    return (
      <div className="py-4 text-center text-gray-500">
        Loading your personal records...
      </div>
    );
  }

  if (!records || records.length === 0) {
    return (
      <div className="py-4 text-center text-gray-500">
        Complete workouts to set personal records!
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl p-4 shadow-sm mb-8 overflow-hidden">
      <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
        <Trophy className="h-5 w-5 text-amber-500" />
        Personal Records
      </h3>
      
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Exercise</TableHead>
              <TableHead className="text-right">Weight</TableHead>
              <TableHead className="text-right">Reps</TableHead>
              <TableHead className="text-right">Date</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {records.map((record) => (
              <TableRow key={record.id}>
                <TableCell className="font-medium">{record.exercise_name}</TableCell>
                <TableCell className="text-right">{record.weight} lbs</TableCell>
                <TableCell className="text-right">{record.reps}</TableCell>
                <TableCell className="text-right">
                  {format(new Date(record.achieved_at), 'MMM d, yyyy')}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};
