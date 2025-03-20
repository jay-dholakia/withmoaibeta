
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

// Form schema
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
  const [invitationEmail, setInvitationEmail] = useState('');
  const navigate = useNavigate();
  const { signUp } = useAuth();
  
  // Form setup
  const form = useForm<RegisterFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: '',
      password: '',
      confirmPassword: '',
    },
  });
  
  // Validate the invitation token
  useEffect(() => {
    const validateToken = async () => {
      if (!token || !type) {
        setLoading(false);
        setIsValid(false);
        toast.error('Invalid or missing invitation parameters');
        return;
      }
      
      try {
        // Check if token exists and is not expired
        const { data, error } = await supabase
          .from('invitations')
          .select('email, accepted, expires_at')
          .eq('token', token)
          .eq('user_type', type)
          .single();
        
        if (error || !data) {
          console.error('Error validating invitation:', error);
          setIsValid(false);
          toast.error('Invalid invitation link');
        } else if (data.accepted) {
          setIsValid(false);
          toast.error('This invitation has already been used');
        } else if (new Date(data.expires_at) < new Date()) {
          setIsValid(false);
          toast.error('This invitation has expired');
        } else {
          setIsValid(true);
          setInvitationEmail(data.email);
          form.setValue('email', data.email);
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
  
  // Handle form submission
  const onSubmit = async (values: RegisterFormValues) => {
    if (!isValid || !type) {
      toast.error('Invalid invitation');
      return;
    }
    
    try {
      // Register the user
      await signUp(values.email, values.password, type as 'client' | 'coach' | 'admin');
      
      // Mark the invitation as accepted
      const { error: updateError } = await supabase
        .from('invitations')
        .update({ accepted: true })
        .eq('token', token);
      
      if (updateError) {
        console.error('Error updating invitation:', updateError);
        // Continue anyway since the user has been created
      }
      
      toast.success('Registration successful!');
      
      // Redirect to the appropriate dashboard
      if (type === 'client') {
        navigate('/client-dashboard');
      } else if (type === 'coach') {
        navigate('/coach-dashboard');
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
        variant={type as 'client' | 'coach' | 'admin' | 'default'}
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
        <Button onClick={() => navigate('/')}>
          Return to Home
        </Button>
      </AuthLayout>
    );
  }
  
  return (
    <AuthLayout 
      title={`Create Your ${type?.charAt(0).toUpperCase() + type?.slice(1)} Account`}
      subtitle="Complete your registration to get started"
      variant={type as 'client' | 'coach' | 'admin' | 'default'}
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
                    <Input {...field} type="email" readOnly disabled className="bg-muted" />
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
