import React, { useState } from 'react';
import { AdminDashboardLayout } from '@/layouts/AdminDashboardLayout';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Table, TableBody, TableCaption, TableCell, 
  TableHead, TableHeader, TableRow 
} from '@/components/ui/table';
import { 
  Dialog, DialogContent, DialogDescription, 
  DialogFooter, DialogHeader, DialogTitle, DialogTrigger 
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Loader2, Copy, CheckCircle, XCircle, RefreshCw } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

interface Invitation {
  id: string;
  email: string;
  user_type: string;
  created_at: string;
  accepted: boolean;
  token: string;
  expires_at: string;
  accepted_at?: string;
}

const InvitationsPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [userType, setUserType] = useState<'client' | 'coach'>('client');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [inviteLink, setInviteLink] = useState('');
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { userType: currentUserType, session } = useAuth();
  
  React.useEffect(() => {
    if (currentUserType !== 'admin') {
      navigate('/admin');
    }
  }, [currentUserType, navigate]);

  const { data: invitations, isLoading } = useQuery({
    queryKey: ['invitations'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('invitations')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as Invitation[];
    },
    enabled: currentUserType === 'admin'
  });
  
  const sendInvitation = useMutation({
    mutationFn: async ({ email, userType }: { email: string; userType: 'client' | 'coach' }) => {
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-invitation`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`
        },
        body: JSON.stringify({ email, userType })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to send invitation');
      }
      
      return await response.json();
    },
    onSuccess: (data) => {
      setInviteLink(`${window.location.origin}/register?token=${data.token}&type=${userType}`);
      queryClient.invalidateQueries({ queryKey: ['invitations'] });
      toast.success(`Invitation sent to ${email}`);
      setEmail('');
    },
    onError: (error: Error) => {
      toast.error(`Failed to send invitation: ${error.message}`);
    }
  });
  
  const copyToClipboard = () => {
    navigator.clipboard.writeText(inviteLink);
    toast.success('Invitation link copied to clipboard');
  };
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      toast.error('Please enter an email address');
      return;
    }
    sendInvitation.mutate({ email, userType });
    setIsDialogOpen(false);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const pendingInvitations = invitations?.filter(inv => 
    !inv.accepted && new Date(inv.expires_at) > new Date()
  ) || [];
  
  const expiredInvitations = invitations?.filter(inv => 
    !inv.accepted && new Date(inv.expires_at) <= new Date()
  ) || [];
  
  const acceptedInvitations = invitations?.filter(inv => inv.accepted) || [];

  if (currentUserType !== 'admin') {
    return null;
  }

  return (
    <AdminDashboardLayout title="Manage Invitations">
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-semibold">Invitations</h2>
          
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                New Invitation
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Send New Invitation</DialogTitle>
                <DialogDescription>
                  Invite a new user to create a client or coach account.
                </DialogDescription>
              </DialogHeader>
              
              <form onSubmit={handleSubmit} className="space-y-4 mt-4">
                <div className="space-y-2">
                  <label htmlFor="email" className="text-sm font-medium">
                    Email Address
                  </label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="user@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <label htmlFor="userType" className="text-sm font-medium">
                    Account Type
                  </label>
                  <div className="flex space-x-4">
                    <Button
                      type="button"
                      variant={userType === 'client' ? 'default' : 'outline'}
                      onClick={() => setUserType('client')}
                      className={userType === 'client' ? 'bg-client text-white' : ''}
                    >
                      Client
                    </Button>
                    <Button
                      type="button"
                      variant={userType === 'coach' ? 'default' : 'outline'}
                      onClick={() => setUserType('coach')}
                      className={userType === 'coach' ? 'bg-coach text-white' : ''}
                    >
                      Coach
                    </Button>
                  </div>
                </div>
                
                <DialogFooter>
                  <Button 
                    type="submit" 
                    disabled={sendInvitation.isPending}
                    className={userType === 'client' ? 'bg-client hover:bg-client/90' : 'bg-coach hover:bg-coach/90'}
                  >
                    {sendInvitation.isPending && (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    )}
                    Send Invitation
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
          
          {inviteLink && (
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline">
                  <Copy className="w-4 h-4 mr-2" />
                  Copy Last Invite Link
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Invitation Link</DialogTitle>
                  <DialogDescription>
                    Share this link with the invited user.
                  </DialogDescription>
                </DialogHeader>
                <div className="flex items-center space-x-2 mt-4">
                  <Input value={inviteLink} readOnly />
                  <Button onClick={copyToClipboard} size="sm">
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          )}
        </div>
        
        <Tabs defaultValue="pending">
          <TabsList>
            <TabsTrigger value="pending">
              Pending ({pendingInvitations.length})
            </TabsTrigger>
            <TabsTrigger value="expired">
              Expired ({expiredInvitations.length})
            </TabsTrigger>
            <TabsTrigger value="accepted">
              Accepted ({acceptedInvitations.length})
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="pending" className="pt-4">
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Email</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Date Sent</TableHead>
                      <TableHead>Expires</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoading ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-6">
                          <Loader2 className="w-6 h-6 mx-auto animate-spin" />
                        </TableCell>
                      </TableRow>
                    ) : pendingInvitations.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center text-muted-foreground py-6">
                          No pending invitations found
                        </TableCell>
                      </TableRow>
                    ) : (
                      pendingInvitations.map((invitation) => (
                        <TableRow key={invitation.id}>
                          <TableCell>{invitation.email}</TableCell>
                          <TableCell>
                            <span className={invitation.user_type === 'client' ? 'text-client' : 'text-coach'}>
                              {invitation.user_type.charAt(0).toUpperCase() + invitation.user_type.slice(1)}
                            </span>
                          </TableCell>
                          <TableCell>{formatDate(invitation.created_at)}</TableCell>
                          <TableCell>{formatDate(invitation.expires_at)}</TableCell>
                          <TableCell>
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                              Pending
                            </span>
                          </TableCell>
                          <TableCell>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => {
                                setInviteLink(`${window.location.origin}/register?token=${invitation.token}&type=${invitation.user_type}`);
                                copyToClipboard();
                              }}
                            >
                              <Copy className="w-4 h-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="expired" className="pt-4">
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Email</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Date Sent</TableHead>
                      <TableHead>Expired On</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoading ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-6">
                          <Loader2 className="w-6 h-6 mx-auto animate-spin" />
                        </TableCell>
                      </TableRow>
                    ) : expiredInvitations.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center text-muted-foreground py-6">
                          No expired invitations found
                        </TableCell>
                      </TableRow>
                    ) : (
                      expiredInvitations.map((invitation) => (
                        <TableRow key={invitation.id}>
                          <TableCell>{invitation.email}</TableCell>
                          <TableCell>
                            <span className={invitation.user_type === 'client' ? 'text-client' : 'text-coach'}>
                              {invitation.user_type.charAt(0).toUpperCase() + invitation.user_type.slice(1)}
                            </span>
                          </TableCell>
                          <TableCell>{formatDate(invitation.created_at)}</TableCell>
                          <TableCell>{formatDate(invitation.expires_at)}</TableCell>
                          <TableCell>
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                              Expired
                            </span>
                          </TableCell>
                          <TableCell>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => {
                                toast.info('Resend invitation functionality will be implemented soon');
                              }}
                            >
                              <RefreshCw className="w-4 h-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="accepted" className="pt-4">
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Email</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Date Sent</TableHead>
                      <TableHead>Date Accepted</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoading ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-6">
                          <Loader2 className="w-6 h-6 mx-auto animate-spin" />
                        </TableCell>
                      </TableRow>
                    ) : acceptedInvitations.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center text-muted-foreground py-6">
                          No accepted invitations found
                        </TableCell>
                      </TableRow>
                    ) : (
                      acceptedInvitations.map((invitation) => (
                        <TableRow key={invitation.id}>
                          <TableCell>{invitation.email}</TableCell>
                          <TableCell>
                            <span className={invitation.user_type === 'client' ? 'text-client' : 'text-coach'}>
                              {invitation.user_type.charAt(0).toUpperCase() + invitation.user_type.slice(1)}
                            </span>
                          </TableCell>
                          <TableCell>{formatDate(invitation.created_at)}</TableCell>
                          <TableCell>
                            {formatDate(invitation.accepted_at || invitation.created_at)}
                          </TableCell>
                          <TableCell>
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              Accepted
                            </span>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AdminDashboardLayout>
  );
};

export default InvitationsPage;
