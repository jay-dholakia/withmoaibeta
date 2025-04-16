
import React from 'react';
import { Button } from '@/components/ui/button';
import { InPageActivityLogger } from './InPageActivityLogger';
import { Plus } from 'lucide-react';
import { Link } from 'react-router-dom';

interface LogActivityButtonsProps {
  onActivityLogged?: () => void;
}

export const LogActivityButtons: React.FC<LogActivityButtonsProps> = ({ onActivityLogged }) => {
  return (
    <>
      <InPageActivityLogger onActivityLogged={onActivityLogged} />
    </>
  );
};
