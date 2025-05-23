
import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { 
  Form, FormControl, FormField, FormItem, 
  FormLabel, FormMessage 
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { AuthLayout } from '@/layouts/AuthLayout';
import { Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const formSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

type RegisterFormValues = z.infer<typeof formSchema>;

const RegisterPage = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const type = searchParams.get('type');
  const [loading, setLoading] = useState(true);
  const [isValid, setIsValid] = useState(false);
  const [isShareableLink, setIsShareableLink] = useState(false);
  const [invitationEmail, setInvitationEmail] = useState('');
  const [invitation, setInvitation] = useState<any>(null);
  const navigate = useNavigate();
  const { signUp, user } = useAuth();
  
  const form = useForm<RegisterFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: '',
      password: '',
      confirmPassword: '',
    },
  });
  
  useEffect(() => {
    if (user && type) {
      console.log('User authenticated, redirecting to dashboard for type:', type);
      if (type === 'client') {
        navigate('/client-dashboard/settings/edit-profile');
      } else if (type === 'coach') {
        navigate('/coach-dashboard');
      } else if (type === 'admin') {
        navigate('/admin-dashboard');
      }
    }
  }, [user, type, navigate]);
  
  useEffect(() => {
    const validateToken = async () => {
      if (!token || !type) {
        setLoading(false);
        setIsValid(false);
        toast.error('Invalid or missing invitation parameters');
        return;
      }
      
      try {
        console.log(`Validating token: ${token} for type: ${type}`);
        
        const { data, error } = await supabase
          .from('invitations')
          .select('id, email, accepted, expires_at, is_share_link')
          .eq('token', token)
          .eq('user_type', type)
          .single();
        
        console.log('Invitation validation response:', { data, error });
        
        if (error || !data) {
          console.error('Error validating invitation:', error);
          setIsValid(false);
          toast.error('Invalid invitation link');
        } else if (data.accepted && !data.is_share_link) {
          setIsValid(false);
          toast.error('This invitation has already been used');
        } else if (new Date(data.expires_at) < new Date()) {
          console.log('Invitation expired on:', new Date(data.expires_at), 'Current time:', new Date());
          setIsValid(false);
          toast.error('This invitation has expired');
        } else {
          console.log('Invitation is valid:', data);
          setIsValid(true);
          setIsShareableLink(data.is_share_link || false);
          setInvitationEmail(data.email || '');
          setInvitation(data);
          
          if (data.email && !data.is_share_link) {
            form.setValue('email', data.email);
          }
        }
      } catch (error) {
        console.error('Error in validateToken:', error);
        setIsValid(false);
        toast.error('Error validating invitation');
      } finally {
        setLoading(false);
      }
    };
    
    validateToken();
  }, [token, type, form]);
  
  const onSubmit = async (values: RegisterFormValues) => {
    if (!isValid || !type || !invitation) {
      toast.error('Invalid invitation');
      return;
    }
    
    try {
      console.log('Starting registration with values:', values);
      
      const signUpResult = await signUp(values.email, values.password, type as 'client' | 'coach' | 'admin');
      console.log('Signup result:', signUpResult);
      
      if (isShareableLink) {
        // For shareable links, track usage in invitation_usage table instead of marking the invitation as accepted
        const { error: usageError } = await supabase
          .from('invitation_usage')
          .insert({ 
            invitation_id: invitation.id,
            user_email: values.email,
          });
          
        if (usageError) {
          console.error('Error tracking invitation usage:', usageError);
        } else {
          console.log('Invitation usage tracked successfully');
        }
      } else {
        // For single-use invitations, mark as accepted
        const now = new Date().toISOString();
        const { error: updateError } = await supabase
          .from('invitations')
          .update({ 
            accepted: true,
            accepted_at: now,
            email: values.email
          })
          .eq('id', invitation.id);
        
        if (updateError) {
          console.error('Error updating invitation:', updateError);
        } else {
          console.log('Invitation marked as accepted successfully');
        }
      }
      
      // If client user type, redirect to profile builder instead of waiting for auth state change
      if (type === 'client') {
        toast.success('Registration successful! Please complete your profile.');
        navigate('/client-profile-builder');
      } else {
        toast.success('Registration successful!');
      }
    } catch (error) {
      console.error('Error in registration:', error);
      toast.error('Registration failed. Please try again.');
    }
  };
  
  if (loading) {
    return (
      <AuthLayout 
        title="Validating Invitation" 
        variant={(type as 'client' | 'coach' | 'admin' | 'default') || 'default'}
      >
        <div className="flex justify-center items-center p-8">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </AuthLayout>
    );
  }
  
  if (!isValid) {
    return (
      <AuthLayout 
        title="Invalid Invitation" 
        subtitle="This invitation link is invalid or has expired."
        variant="default"
      >
        <div className="space-y-4">
          <p className="text-center text-sm text-muted-foreground">
            Please contact the administrator to request a new invitation.
          </p>
          <Button className="w-full" onClick={() => navigate('/')}>
            Return to Home
          </Button>
        </div>
      </AuthLayout>
    );
  }
  
  return (
    <AuthLayout 
      title={`Create Your ${type?.charAt(0).toUpperCase() + type?.slice(1)} Account`}
      subtitle="Complete your registration to get started"
      variant={(type as 'client' | 'coach' | 'admin' | 'default') || 'default'}
    >
      <div className="w-full max-w-md">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input 
                      {...field} 
                      type="email" 
                      readOnly={!isShareableLink && !!invitationEmail}
                      disabled={!isShareableLink && !!invitationEmail}
                      className={!isShareableLink && !!invitationEmail ? "bg-muted" : ""}
                      placeholder={isShareableLink ? "Enter your email address" : ""}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Password</FormLabel>
                  <FormControl>
                    <Input {...field} type="password" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="confirmPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Confirm Password</FormLabel>
                  <FormControl>
                    <Input {...field} type="password" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <Button 
              type="submit" 
              className="w-full"
              disabled={form.formState.isSubmitting}
            >
              {form.formState.isSubmitting && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Create Account
            </Button>
          </form>
        </Form>
      </div>
    </AuthLayout>
  );
};

export default RegisterPage;
