
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
import { ScrollArea } from '@/components/ui/scroll-area';

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
    <div className="bg-white rounded-xl p-4 shadow-sm mb-8 w-full">
      <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
        <Trophy className="h-5 w-5 text-amber-500" />
        Personal Records
      </h3>
      
      <ScrollArea className="max-h-[320px] w-full">
        <div className="w-full">
          <Table className="w-full">
            <TableHeader>
              <TableRow>
                <TableHead className="w-[40%] px-2 py-3 text-center">Exercise</TableHead>
                <TableHead className="w-[15%] px-2 py-3 text-center">Weight</TableHead>
                <TableHead className="w-[15%] px-2 py-3 text-center">Reps</TableHead>
                <TableHead className="w-[30%] px-2 py-3 text-center">Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {records.map((record) => (
                <TableRow key={record.id}>
                  <TableCell className="font-medium px-2 py-2 text-center">{record.exercise_name}</TableCell>
                  <TableCell className="px-2 py-2 text-center">{record.weight} lbs</TableCell>
                  <TableCell className="px-2 py-2 text-center">{record.reps}</TableCell>
                  <TableCell className="px-2 py-2 break-words text-center">
                    {format(new Date(record.achieved_at), 'MMM d, yyyy')}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </ScrollArea>
    </div>
  );
};
