
import React from 'react';
import { 
  Table, TableBody, TableCaption, TableCell, 
  TableHead, TableHeader, TableRow 
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Copy, Loader2, RefreshCw, Users } from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';

export interface Invitation {
  id: string;
  email: string;
  user_type: string;
  created_at: string;
  accepted: boolean;
  token: string;
  expires_at: string;
  accepted_at: string | null;
  is_share_link?: boolean;
  share_link_type?: string;
  usageCount?: number;
}

interface InvitationTableProps {
  invitations: Invitation[];
  isLoading: boolean;
  emptyMessage: string;
  type: 'pending' | 'expired' | 'accepted';
  onCopyInvite?: (token: string, userType: string) => void;
  onResendInvite?: (invitation: Invitation) => void;
  isResending?: Record<string, boolean>;
}

export const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

export const InvitationTable: React.FC<InvitationTableProps> = ({
  invitations,
  isLoading,
  emptyMessage,
  type,
  onCopyInvite,
  onResendInvite,
  isResending = {}
}) => {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Email / Type</TableHead>
          <TableHead>Date {type === 'accepted' ? 'Accepted' : 'Sent'}</TableHead>
          <TableHead>
            {type === 'pending' ? 'Expires' : 
             type === 'expired' ? 'Expired On' : 
             'Details'}
          </TableHead>
          <TableHead>Status</TableHead>
          {type !== 'accepted' && <TableHead>Actions</TableHead>}
        </TableRow>
      </TableHeader>
      <TableBody>
        {isLoading ? (
          <TableRow>
            <TableCell colSpan={type === 'accepted' ? 4 : 5} className="text-center py-6">
              <Loader2 className="w-6 h-6 mx-auto animate-spin" />
            </TableCell>
          </TableRow>
        ) : invitations.length === 0 ? (
          <TableRow>
            <TableCell colSpan={type === 'accepted' ? 4 : 5} className="text-center text-muted-foreground py-6">
              {emptyMessage}
            </TableCell>
          </TableRow>
        ) : (
          invitations.map((invitation) => (
            <TableRow key={invitation.id}>
              <TableCell>
                <div>
                  {invitation.email || (invitation.is_share_link ? "Shareable Link" : "Unknown")}
                  <div>
                    <span className={
                      invitation.user_type === 'client' ? 'text-client' : 
                      invitation.user_type === 'coach' ? 'text-coach' : 
                      'text-blue-500'
                    }>
                      {invitation.user_type.charAt(0).toUpperCase() + invitation.user_type.slice(1)}
                    </span>
                    {invitation.is_share_link && (
                      <Badge variant="outline" className="ml-2">
                        <Users className="h-3 w-3 mr-1" />
                        Shareable
                      </Badge>
                    )}
                  </div>
                </div>
              </TableCell>
              <TableCell>
                {type === 'accepted' && invitation.accepted_at
                  ? formatDate(invitation.accepted_at)
                  : formatDate(invitation.created_at)
                }
              </TableCell>
              <TableCell>
                {type === 'pending' || type === 'expired'
                  ? formatDate(invitation.expires_at)
                  : invitation.is_share_link 
                    ? `${invitation.usageCount || 0} user${invitation.usageCount === 1 ? '' : 's'} registered` 
                    : 'Single-use invitation'
                }
              </TableCell>
              <TableCell>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                  ${type === 'pending' ? 'bg-yellow-100 text-yellow-800' : 
                   type === 'expired' ? 'bg-red-100 text-red-800' :
                   'bg-green-100 text-green-800'}`
                }>
                  {type === 'pending' 
                    ? invitation.is_share_link 
                      ? 'Active' 
                      : 'Pending'
                    : type === 'expired' 
                      ? 'Expired' 
                      : invitation.is_share_link 
                        ? 'In Use' 
                        : 'Accepted'
                  }
                </span>
              </TableCell>
              {type !== 'accepted' && (
                <TableCell>
                  <div className="flex gap-2">
                    {type === 'pending' && (
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => onCopyInvite && onCopyInvite(invitation.token, invitation.user_type)}
                        title="Copy invitation link"
                      >
                        <Copy className="w-4 h-4" />
                      </Button>
                    )}
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => onResendInvite && onResendInvite(invitation)}
                      disabled={isResending[invitation.id]}
                      title="Resend invitation"
                    >
                      <RefreshCw className={`w-4 h-4 ${isResending[invitation.id] ? 'animate-spin' : ''}`} />
                    </Button>
                  </div>
                </TableCell>
              )}
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  );
};
