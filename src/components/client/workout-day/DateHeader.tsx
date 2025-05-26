
import { format } from 'date-fns';

interface DateHeaderProps {
  date: Date;
}

export const DateHeader: React.FC<DateHeaderProps> = ({ date }) => {
  return (
    <h3 className="text-lg font-medium">{format(date, 'MMMM d, yyyy')}</h3>
  );
};
