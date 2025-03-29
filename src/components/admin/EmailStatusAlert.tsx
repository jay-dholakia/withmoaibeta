
import React from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Info, AlertCircle } from 'lucide-react';

interface EmailStatusAlertProps {
  status: {
    sent: boolean;
    email?: string;
    error?: string;
    timestamp: Date;
  } | null;
}

export const EmailStatusAlert: React.FC<EmailStatusAlertProps> = ({ status }) => {
  if (!status) return null;

  return (
    <Alert variant={status.sent ? "default" : "destructive"} className="mb-4">
      <div className="flex items-start">
        {status.sent ? (
          <Info className="h-5 w-5 mr-2 text-blue-500" />
        ) : (
          <AlertCircle className="h-5 w-5 mr-2" />
        )}
        <AlertDescription>
          <p className="font-medium">
            {status.sent 
              ? `Email sent successfully to ${status.email}` 
              : `Email could not be sent to ${status.email}`
            }
          </p>
          {!status.sent && status.error && (
            <p className="text-sm mt-1">{status.error}</p>
          )}
          <p className="text-xs text-muted-foreground mt-1">
            {new Date(status.timestamp).toLocaleTimeString()}
          </p>
        </AlertDescription>
      </div>
    </Alert>
  );
};
